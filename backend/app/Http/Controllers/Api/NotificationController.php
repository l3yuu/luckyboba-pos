<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications/summary
     * Returns grouped notification counts + items for the POS bell.
     */
    public function summary(): JsonResponse
    {
        $notifications = [];

        // ── 1. Low stock items ─────────────────────────────────────────────
        try {
            $lowStock = DB::table('inventory_items')
                ->where('quantity', '<=', DB::raw('reorder_point'))
                ->where('status', 'active')
                ->select('id', 'name', 'quantity', 'reorder_point', 'unit')
                ->orderBy('quantity')
                ->limit(10)
                ->get();

            foreach ($lowStock as $item) {
                $notifications[] = [
                    'id'       => 'stock_' . $item->id,
                    'type'     => 'low_stock',
                    'title'    => 'Low Stock: ' . $item->name,
                    'message'  => "Only {$item->quantity} {$item->unit} left (reorder at {$item->reorder_point}).",
                    'severity' => $item->quantity == 0 ? 'critical' : 'warning',
                    'at'       => now()->toISOString(),
                ];
            }
        } catch (\Throwable $e) {
            // Table may not exist in all environments — skip silently
        }

        // ── 2. Recent void / cancelled transactions (last 24 h) ────────────
        try {
            $voids = DB::table('sales')
                ->where('status', 'cancelled')
                ->where('updated_at', '>=', Carbon::now()->subDay())
                ->select('id', 'si_number', 'total', 'updated_at', 'cashier_name')
                ->orderByDesc('updated_at')
                ->limit(5)
                ->get();

            foreach ($voids as $sale) {
                $notifications[] = [
                    'id'       => 'void_' . $sale->id,
                    'type'     => 'void',
                    'title'    => 'Voided: #' . $sale->si_number,
                    'message'  => '₱' . number_format($sale->total, 2) . ' voided by ' . ($sale->cashier_name ?? 'staff') . '.',
                    'severity' => 'info',
                    'at'       => $sale->updated_at,
                ];
            }
        } catch (\Throwable $e) {}

        // ── 3. Cash-in not done today ──────────────────────────────────────
        try {
            $today = Carbon::today();
            $cashedIn = DB::table('cash_transactions')
                ->whereDate('created_at', $today)
                ->where('type', 'cash_in')
                ->exists();

            if (!$cashedIn) {
                $notifications[] = [
                    'id'       => 'cash_in_missing',
                    'type'     => 'cash_in',
                    'title'    => 'Cash-In Not Started',
                    'message'  => 'No cash-in recorded for today. Terminal is locked for new orders.',
                    'severity' => 'critical',
                    'at'       => now()->toISOString(),
                ];
            }
        } catch (\Throwable $e) {}

        // ── 4. Pending purchase orders ─────────────────────────────────────
        try {
            $pendingPos = DB::table('purchase_orders')
                ->where('status', 'pending')
                ->select('id', 'po_number', 'created_at', 'supplier_name')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get();

            foreach ($pendingPos as $po) {
                $notifications[] = [
                    'id'       => 'po_' . $po->id,
                    'type'     => 'purchase_order',
                    'title'    => 'Pending PO: #' . ($po->po_number ?? $po->id),
                    'message'  => 'Purchase order from ' . ($po->supplier_name ?? 'supplier') . ' is awaiting approval.',
                    'severity' => 'info',
                    'at'       => $po->created_at,
                ];
            }
        } catch (\Throwable $e) {}

        // ── Sort: critical first, then warning, then info ──────────────────
        $order = ['critical' => 0, 'warning' => 1, 'info' => 2];
        usort($notifications, fn($a, $b) =>
            ($order[$a['severity']] ?? 9) <=> ($order[$b['severity']] ?? 9)
        );

        return response()->json([
            'count'         => count($notifications),
            'notifications' => $notifications,
        ]);
    }
}