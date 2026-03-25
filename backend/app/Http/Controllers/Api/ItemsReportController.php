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

            // Prorate each item's amount against the actual paid sale total.
            // Discounts are stored at the sale level (sales.total_amount),
            // not at the item level (discount_amount is always 0).
            // Formula: item_subtotal * (sale_paid / sale_subtotal)
            $saleSubtotalSql = '(SELECT SUM(si2.final_price * si2.quantity) FROM sale_items si2 WHERE si2.sale_id = sales.id)';
            $proratedAmount  = "SUM(
                sale_items.final_price * sale_items.quantity
                * (sales.total_amount / NULLIF({$saleSubtotalSql}, 0))
            )";

            if ($type === 'category-summary') {
                $items = DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                    ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                    ->whereBetween('sales.created_at', [
                        $from . ' 00:00:00',
                        $to   . ' 23:59:59',
                    ])
                    ->where('sales.status', '!=', 'cancelled')
                    ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                    ->select(
                        DB::raw("COALESCE(categories.name, 'Uncategorized') as name"),
                        DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                        DB::raw('SUM(sale_items.quantity) as qty'),
                        DB::raw("{$proratedAmount} as amount")
                    )
                    ->groupBy('categories.name')
                    ->orderByDesc('amount')
                    ->get();
            } else {
                $items = DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                    ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                    ->whereBetween('sales.created_at', [
                        $from . ' 00:00:00',
                        $to   . ' 23:59:59',
                    ])
                    ->where('sales.status', '!=', 'cancelled')
                    ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                    ->select(
                        'sale_items.product_name as name',
                        DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                        DB::raw('SUM(sale_items.quantity) as qty'),
                        DB::raw("{$proratedAmount} as amount")
                    )
                    ->groupBy('sale_items.product_name', 'categories.name')
                    ->orderByDesc('amount')
                    ->get();
            }

            return response()->json([
                'items'        => $items,
                'total_qty'    => (int)   $items->sum('qty'),
                'grand_total'  => round((float) $items->sum('amount'), 2),
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
     */
    public function getItemsSoldToday(Request $request): JsonResponse
    {
        try {
            $date     = $request->input('date', now()->toDateString());
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $saleSubtotalSql = '(SELECT SUM(si2.final_price * si2.quantity) FROM sale_items si2 WHERE si2.sale_id = sales.id)';
            $proratedAmount  = "SUM(
                sale_items.final_price * sale_items.quantity
                * (sales.total_amount / NULLIF({$saleSubtotalSql}, 0))
            )";

            $items = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereDate('sales.created_at', $date)
                ->where('sales.status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    'sale_items.product_name as name',
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    DB::raw("{$proratedAmount} as amount")
                )
                ->groupBy('sale_items.product_name')
                ->orderByDesc('amount')
                ->get();

            return response()->json([
                'items'        => $items,
                'total_qty'    => (int)   $items->sum('qty'),
                'grand_total'  => round((float) $items->sum('amount'), 2),
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