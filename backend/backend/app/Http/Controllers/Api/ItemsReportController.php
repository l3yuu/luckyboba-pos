<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ItemsReportController extends Controller
{
    /**
     * GET /api/reports/items-report
     * Params: from, to, type (item-list | category-summary)
     *
     * Response shape expected by ItemsReport.tsx:
     * { items, total_qty, grand_total, cashier_name }
     */
    public function getItemsSoldReport(Request $request): JsonResponse
    {
        try {
            $from = $request->query('from');
            $to   = $request->query('to');
            $type = $request->query('type', 'item-list');

            if (!$from || !$to) {
                return response()->json([
                    'items'        => [],
                    'total_qty'    => 0,
                    'grand_total'  => 0,
                    'cashier_name' => auth()->user()?->name ?? 'System Admin',
                ]);
            }

            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $query = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereBetween('sales.created_at', [
                    $from . ' 00:00:00',
                    $to   . ' 23:59:59',
                ])
                ->where('sales.status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId));

            // Both modes use the same grouping — category join doesn't exist yet
            $items = $query
                ->select(
                    'sale_items.product_name as name',
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    DB::raw('SUM(sale_items.final_price) as amount')
                )
                ->groupBy('sale_items.product_name')
                ->orderByDesc('amount')
                ->get();

            return response()->json([
                'items'        => $items,
                'total_qty'    => (int)   $items->sum('qty'),
                'grand_total'  => (float) $items->sum('amount'),
                'cashier_name' => $user?->name ?? 'System Admin',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'items'       => [],
                'total_qty'   => 0,
                'grand_total' => 0,
                'message'     => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/reports/items-today
     * Quick endpoint for today's items
     */
    public function getItemsSoldToday(Request $request): JsonResponse
    {
        try {
            $date     = $request->input('date', now()->toDateString());
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $items = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereDate('sales.created_at', $date)
                ->where('sales.status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    'sale_items.product_name as name',
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    DB::raw('SUM(sale_items.final_price) as amount')
                )
                ->groupBy('sale_items.product_name')
                ->orderByDesc('amount')
                ->get();

            return response()->json([
                'items'        => $items,
                'total_qty'    => (int)   $items->sum('qty'),
                'grand_total'  => (float) $items->sum('amount'),
                'cashier_name' => $user?->name ?? 'System Admin',
                'date'         => $date,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'items'       => [],
                'total_qty'   => 0,
                'grand_total' => 0,
                'message'     => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/reports/items-test
     */
    public function test(): JsonResponse
    {
        return response()->json([
            'success'   => true,
            'message'   => 'Items Report API is working!',
            'timestamp' => now()->toDateTimeString(),
        ]);
    }
}