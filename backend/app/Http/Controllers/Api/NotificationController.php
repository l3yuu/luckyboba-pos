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
        $user = auth()->user();
        $isBM = $user->role === 'branch_manager' || $user->role === 'supervisor';
        $targetBranchId = $isBM ? $user->branch_id : null;

        // ── 1. Low stock items (Raw Materials) ──────────────────────────────
        try {
            $query = DB::table('raw_materials')
                ->where('current_stock', '<=', DB::raw('reorder_level'));
            
            if ($isBM && $targetBranchId) {
                $query->where('branch_id', $targetBranchId);
            }

            $lowStock = $query->select('id', 'name', 'current_stock', 'reorder_level', 'unit')
                ->orderBy('current_stock')
                ->limit(10)
                ->get();

            foreach ($lowStock as $item) {
                $notifications[] = [
                    'id'          => 'stock_' . $item->id,
                    'type'        => 'low_stock',
                    'title'       => 'Low Stock: ' . $item->name,
                    'message'     => "Only {$item->current_stock} {$item->unit} left (reorder at {$item->reorder_level}).",
                    'severity'    => $item->current_stock <= 0 ? 'critical' : 'warning',
                    'at'          => now()->toISOString(),
                    'branch_name' => 'Main Inventory', // raw_materials is global in this schema
                ];
            }
        } catch (\Throwable $e) {}

        // ── 2. Recent void / cancelled transactions (last 24 h) ────────────
        try {
            $query = DB::table('sales')
                ->leftJoin('branches', 'sales.branch_id', '=', 'branches.id')
                ->where('sales.status', 'cancelled')
                ->where('sales.updated_at', '>=', Carbon::now()->subDay());

            if ($isBM && $targetBranchId) {
                $query->where('sales.branch_id', $targetBranchId);
            }

            $voids = $query->select(
                    'sales.id', 
                    'sales.invoice_number', 
                    'sales.total_amount', 
                    'sales.updated_at', 
                    'sales.customer_name',
                    'branches.name as branch_name'
                )
                ->orderByDesc('sales.updated_at')
                ->limit(5)
                ->get();

            foreach ($voids as $sale) {
                $notifications[] = [
                    'id'          => 'void_' . $sale->id,
                    'type'        => 'void',
                    'title'       => 'Voided: #' . ($sale->invoice_number ?? $sale->id),
                    'message'     => '₱' . number_format($sale->total_amount, 2) . ' voided for ' . ($sale->customer_name ?? 'Customer') . '.',
                    'severity'    => 'info',
                    'at'          => $sale->updated_at,
                    'branch_name' => $sale->branch_name ?? 'Unknown Branch',
                ];
            }
        } catch (\Throwable $e) {}

        // ── 3. Cash-in not done today ──────────────────────────────────────
        try {
            $today = Carbon::today();
            $query = DB::table('branches')
                ->whereNotExists(function ($query) use ($today) {
                    $query->select(DB::raw(1))
                        ->from('cash_transactions')
                        ->whereRaw('cash_transactions.branch_id = branches.id')
                        ->whereDate('cash_transactions.created_at', $today)
                        ->where('cash_transactions.type', 'cash_in');
                })
                ->where('branches.status', 'active');

            if ($isBM && $targetBranchId) {
                $query->where('branches.id', $targetBranchId);
            }

            $branchesMissingCashIn = $query->select('id', 'name')
                ->get();

            foreach ($branchesMissingCashIn as $branch) {
                $notifications[] = [
                    'id'          => 'cash_in_missing_' . $branch->id,
                    'type'        => 'cash_in',
                    'title'       => 'Cash-In Missing',
                    'message'     => "No cash-in recorded for today at {$branch->name}.",
                    'severity'    => 'critical',
                    'at'          => now()->toISOString(),
                    'branch_name' => $branch->name,
                ];
            }
        } catch (\Throwable $e) {}

        // ── 4. Pending purchase orders (SuperAdmin Only) ──────────────────────
        if (!$isBM) {
            try {
                $pendingPos = DB::table('purchase_orders')
                    ->where('status', 'Pending')
                    ->select('id', 'po_number', 'created_at', 'supplier', 'total_amount')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get();

                foreach ($pendingPos as $po) {
                    $notifications[] = [
                        'id'          => 'po_' . $po->id,
                        'type'        => 'purchase_order',
                        'title'       => 'Pending PO: #' . ($po->po_number ?? $po->id),
                        'message'     => 'PO for ₱' . number_format($po->total_amount, 2) . ' from ' . $po->supplier . ' is awaiting approval.',
                        'severity'    => 'info',
                        'at'          => $po->created_at,
                        'branch_name' => 'Main Office',
                    ];
                }
            } catch (\Throwable $e) {}
        }

        // ── 5. Pending online orders waiting > 5 min ──────────────────────
        try {
            $query = DB::table('sales')
                ->leftJoin('branches', 'sales.branch_id', '=', 'branches.id')
                ->where('sales.invoice_number', 'like', 'APP-%')
                ->where('sales.status', 'pending')
                ->where('sales.created_at', '<=', Carbon::now()->subMinutes(5));

            if ($isBM && $targetBranchId) {
                $query->where('sales.branch_id', $targetBranchId);
            }

            $staleOrders = $query->select(
                    'sales.id',
                    'sales.invoice_number',
                    'sales.total_amount',
                    'sales.customer_name',
                    'sales.created_at',
                    'branches.name as branch_name'
                )
                ->orderByDesc('sales.created_at')
                ->limit(5)
                ->get();

            foreach ($staleOrders as $order) {
                $waitMin = Carbon::parse($order->created_at)->diffInMinutes(now());
                $notifications[] = [
                    'id'          => 'order_' . $order->id,
                    'type'        => 'online_order',
                    'title'       => 'Pending Order: #' . ($order->invoice_number ?? $order->id),
                    'message'     => '₱' . number_format($order->total_amount, 2)
                                   . ' from ' . ($order->customer_name ?? 'App Customer')
                                   . " — waiting {$waitMin} min.",
                    'severity'    => $waitMin >= 10 ? 'critical' : 'warning',
                    'at'          => $order->created_at,
                    'branch_name' => $order->branch_name ?? 'Unknown Branch',
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