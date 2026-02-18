<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardService
{
    // ============================================================
    // EXISTING METHODS (Keep these as-is)
    // ============================================================
    
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

    // ============================================================
    // FIXED: WEEKLY SALES NOW SHOWS CURRENT WEEK (MONDAY-SUNDAY)
    // ============================================================
    
    /**
     * Get weekly sales data for CURRENT WEEK (Monday to Sunday)
     * Automatically resets every Monday
     */
    public function getWeeklySalesData()
    {
        // Get current week's Monday and Sunday
        $currentWeekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $currentWeekEnd = Carbon::now()->endOfWeek(Carbon::SUNDAY);

        // If today is before Wednesday, we might want to show some previous week data too
        // But let's stick to showing Monday-Sunday of current week
        $startDate = $currentWeekStart->copy();
        $endDate = $currentWeekEnd->copy();

        // Fetch sales data for the current week
        $salesData = Sale::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        // Create array for all 7 days (Monday to Sunday)
        $weekData = [];
        $totalRevenue = 0;
        
        $currentDay = $currentWeekStart->copy();
        
        // Loop through Monday to Sunday
        for ($i = 0; $i < 7; $i++) {
            $dateStr = $currentDay->format('Y-m-d');
            
            // Find matching sales data
            $dayData = $salesData->firstWhere('date', $dateStr);
            $amount = $dayData ? (float)$dayData->total : 0;
            
            $weekData[] = [
                'day' => $currentDay->format('D'), // Mon, Tue, Wed, etc.
                'date' => $currentDay->format('M d'), // Feb 17
                'value' => $amount,
                'full_date' => $dateStr
            ];
            
            $totalRevenue += $amount;
            
            // Move to next day
            $currentDay->addDay();
        }

        return [
            'data' => $weekData,
            'total_revenue' => $totalRevenue,
            'start_date' => $currentWeekStart->format('M d, Y'), // Monday
            'end_date' => $currentWeekEnd->format('M d, Y'),     // Sunday
            'current_week_start' => $currentWeekStart->format('Y-m-d'), // e.g., "2026-02-17" (Monday)
        ];
    }

    /**
     * Get today's sales grouped by 2-hour intervals
     */
    public function getTodayHourlySales()
    {
        $today = Carbon::today();
        $startOfDay = $today->toDateTimeString();
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        $salesData = Sale::select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour', 'asc')
            ->get();

        // Create 2-hour intervals from 10 AM to 8 PM
        $intervals = [
            ['time' => '10 AM', 'start' => 10, 'end' => 11],
            ['time' => '12 PM', 'start' => 12, 'end' => 13],
            ['time' => '2 PM', 'start' => 14, 'end' => 15],
            ['time' => '4 PM', 'start' => 16, 'end' => 17],
            ['time' => '6 PM', 'start' => 18, 'end' => 19],
            ['time' => '8 PM', 'start' => 20, 'end' => 21],
        ];

        $hourlyData = [];

        foreach ($intervals as $interval) {
            $total = 0;
            
            // Sum sales for hours in this interval
            foreach ($salesData as $sale) {
                if ($sale->hour >= $interval['start'] && $sale->hour <= $interval['end']) {
                    $total += (float)$sale->total;
                }
            }

            $hourlyData[] = [
                'time' => $interval['time'],
                'value' => $total
            ];
        }

        return [
            'data' => $hourlyData,
            'date' => $today->format('M d, Y')
        ];
    }

    /**
     * Get sales statistics for today
     */
    public function getSalesStatistics()
    {
        $today = Carbon::today();
        $startOfDay = $today->toDateTimeString();
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        // Get all today's stats in one optimized query
        $stats = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->selectRaw("
                SUM(total_amount) as total_sales,
                MIN(id) as beginning_or,
                MAX(id) as ending_or,
                SUM(CASE WHEN is_synced = 0 THEN total_amount ELSE 0 END) as cancelled_sales
            ")
            ->first();

        $todayTotal = (float)($stats->total_sales ?? 0);
        $cancelledSales = (float)($stats->cancelled_sales ?? 0);
        $beginningOR = $stats->beginning_or;
        $endingOR = $stats->ending_or;

        // Format OR numbers as 5-digit strings
        $beginningORFormatted = $beginningOR ? str_pad($beginningOR, 5, '0', STR_PAD_LEFT) : '00000';
        $endingORFormatted = $endingOR ? str_pad($endingOR, 5, '0', STR_PAD_LEFT) : '00000';

        return [
            'beginning_sales' => 0.00, // Typically 0 at start of day
            'today_sales' => $todayTotal,
            'ending_sales' => $todayTotal, // Same as today's total
            'cancelled_sales' => $cancelledSales,
            'beginning_or' => $beginningORFormatted,
            'ending_or' => $endingORFormatted
        ];
    }
}