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
        
        $cacheKey = 'dashboard_stats_' . $today->format('Y-m-d');
        
        return Cache::remember($cacheKey, 120, function () use ($startOfDay, $endOfDay) {
            $cashStats = CashTransaction::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->selectRaw("
                    SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END) as cash_in,
                    SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END) as cash_out
                ")
                ->first();

            $saleStats = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->selectRaw("SUM(total_amount) as total_sales, COUNT(*) as total_orders")
                ->first();

            return [
                'cash_in_today' => $cashStats->cash_in ?? 0,
                'cash_out_today' => $cashStats->cash_out ?? 0,
                'total_sales_today' => $saleStats->total_sales ?? 0,
                'total_orders_today' => $saleStats->total_orders ?? 0,
                'top_seller_today' => $this->getTopSeller($startOfDay, $endOfDay),
                'top_seller_all_time' => $this->getTopSeller(),
            ];
        });
    }

    private function getTopSeller($start = null, $end = null)
    {
        if ($start && $end) {
            $cacheKey = 'top_seller_today_' . Carbon::parse($start)->format('Y-m-d');
            $cacheDuration = 120;
        } else {
            $cacheKey = 'top_seller_all_time';
            $cacheDuration = 3600;
        }
        
        return Cache::remember($cacheKey, $cacheDuration, function () use ($start, $end) {
            $query = DB::table('sale_items')
                ->select('product_name', DB::raw('SUM(quantity) as total_qty'))
                ->groupBy('product_name')
                ->orderByDesc('total_qty')
                ->limit(5);

            if ($start && $end) {
                $query->whereBetween('created_at', [$start, $end]);
            }

            return $query->get();
        });
    }

    /**
     * Clear today's dashboard cache
     * Call this after creating/updating transactions or sales
     */
    public function clearTodayCache()
    {
        $today = Carbon::today();
        Cache::forget('dashboard_stats_' . $today->format('Y-m-d'));
        Cache::forget('top_seller_today_' . $today->format('Y-m-d'));
    }
}