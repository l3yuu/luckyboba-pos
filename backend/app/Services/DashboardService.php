<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardService
{
    public function getHomeStats()
    {
        $today = Carbon::today();
        $startOfDay = $today->toDateTimeString();
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        // No cache — today's data must always be fresh
        $cashStats = CashTransaction::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->selectRaw("
                SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END) as cash_in,
                SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END) as cash_out
            ")
            ->first();

        $saleStats = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('status', 'completed')
            ->selectRaw("SUM(total_amount) as total_sales, COUNT(*) as total_orders")
            ->first();

        $voidedSales = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('status', 'cancelled')
            ->sum('total_amount');

        return [
            'cash_in_today'      => $cashStats->cash_in ?? 0,
            'cash_out_today'     => $cashStats->cash_out ?? 0,
            'total_sales_today'  => $saleStats->total_sales ?? 0,
            'total_orders_today' => $saleStats->total_orders ?? 0,
            'voided_sales_today' => $voidedSales ?? 0,
            'top_seller_today'   => $this->getTopSellerToday($startOfDay, $endOfDay),
            'top_seller_all_time' => $this->getTopSellerAllTime(),
        ];
    }

    // Today's top sellers — no cache, always fresh
    private function getTopSellerToday(string $start, string $end)
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->whereBetween('sale_items.created_at', [$start, $end])
            ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();
    }

    // All-time top sellers — cache for 1 hour, this data changes slowly
    private function getTopSellerAllTime()
    {
        return Cache::remember('top_seller_all_time', 3600, function () {
            return DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where('sales.status', 'completed')
                ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
                ->groupBy('sale_items.product_name')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();
        });
    }

    // Call this when a sale is voided or completed to bust the all-time cache
    public function clearTodayCache()
    {
        Cache::forget('top_seller_all_time');
    }

    public function getTodayTotals()
    {
        return DB::table('sales')
            ->whereDate('created_at', now()->today())
            ->where('status', 'completed')
            ->select(
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('COUNT(*) as total_transactions')
            )
            ->first();
    }
}