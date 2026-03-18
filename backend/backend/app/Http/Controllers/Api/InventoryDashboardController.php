<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryDashboardController extends Controller
{
    public function getWeeklyTopProducts(Request $request)
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $startOfWeek = Carbon::now()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d 00:00:00');
            $endOfWeek   = Carbon::now()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d 23:59:59');

            $topProducts = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                ->whereBetween('sales.created_at', [$startOfWeek, $endOfWeek])
                ->where('sales.status', 'completed')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                ->selectRaw('
                    sale_items.product_name,
                    MAX(menu_items.barcode) as barcode,
                    SUM(sale_items.quantity) as total_qty,
                    MAX(menu_items.cost) as unit_cost,
                    SUM(sale_items.final_price) as total_sold
                ')
                ->groupBy('sale_items.product_name')
                ->orderBy('total_qty', 'desc')
                ->limit(5)
                ->get();

            $data = $topProducts->map(function ($item) {
                $qty   = (int)   $item->total_qty;
                $uCost = (float) ($item->unit_cost ?? 0);
                $sold  = (float) $item->total_sold;
                $tCost = $qty * $uCost;

                return [
                    'name'       => $item->product_name,
                    'barcode'    => $item->barcode ?? 'N/A',
                    'qty'        => $qty,
                    'unit_cost'  => $uCost,
                    'total_cost' => $tCost,
                    'sold_total' => $sold,
                    'profit'     => $sold - $tCost,
                ];
            });

            return response()->json([
                'products'             => $data,
                'weekly_sold_total'    => (float) $data->sum('sold_total'),
                'weekly_profit_total'  => (float) $data->sum('profit'),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Backend Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}