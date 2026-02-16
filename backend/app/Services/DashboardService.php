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
            // 1. Cash Stats
            $cashStats = CashTransaction::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->selectRaw("
                    SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END) as cash_in,
                    SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END) as cash_out
                ")
                ->first();

            // 2. Sale Stats (NET - only completed)
            $saleStats = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'completed') 
                ->selectRaw("SUM(total_amount) as total_sales, COUNT(*) as total_orders")
                ->first();

            // 3. Voided Stats (Calculate how much was deducted)
            $voidedSales = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'cancelled')
                ->sum('total_amount');

            return [
                'cash_in_today' => $cashStats->cash_in ?? 0,
                'cash_out_today' => $cashStats->cash_out ?? 0,
                'total_sales_today' => $saleStats->total_sales ?? 0,
                'total_orders_today' => $saleStats->total_orders ?? 0,
                'voided_sales_today' => $voidedSales ?? 0, // Used for the new Red UI card
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
            // Deduct items from rankings by joining with the parent sale status
            $query = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where('sales.status', 'completed') 
                ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
                ->groupBy('sale_items.product_name')
                ->orderByDesc('total_qty')
                ->limit(5);

            if ($start && $end) {
                $query->whereBetween('sale_items.created_at', [$start, $end]);
            }

            return $query->get();
        });
    }

    public function clearTodayCache()
    {
        $today = Carbon::today();
        $dateKey = $today->format('Y-m-d');

        Cache::forget('dashboard_stats_' . $dateKey);
        Cache::forget('top_seller_today_' . $dateKey);
        Cache::forget('top_seller_all_time');
    }

    public function getTodayTotals()
    {
        $today = now()->today();

        return DB::table('sales')
            ->whereDate('created_at', $today)
            ->where('status', 'completed') 
            ->select(
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('COUNT(*) as total_transactions')
            )
            ->first();
    }
}