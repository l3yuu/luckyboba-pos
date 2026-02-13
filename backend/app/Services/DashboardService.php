<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    public function getHomeStats()
    {
        $today = Carbon::today();
        // Use string comparison instead of whereDate for better index performance
        $startOfDay = $today->toDateTimeString(); 
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        // 1. Combine Cash In and Cash Out into ONE query
        $cashStats = CashTransaction::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->selectRaw("
                SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END) as cash_in,
                SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END) as cash_out
            ")
            ->first();

        // 2. Combine Sale stats into ONE query
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
    }

    private function getTopSeller($start = null, $end = null)
    {
        $query = DB::table('sale_items')
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'))
            ->groupBy('product_name')
            ->orderByDesc('total_qty');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        return $query->first();
    }
    /**
     * Get weekly sales data grouped by day
     * Returns last 8 days including today
     */
    public function getWeeklySalesData()
    {
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subDays(7);

        // Using Sale model instead of DB facade for consistency
        $salesData = Sale::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        // Create array for all 8 days (even if no sales)
        $weekData = [];
        $totalRevenue = 0;

        for ($i = 7; $i >= 0; $i--) {
            $currentDate = Carbon::now()->subDays($i);
            $dateStr = $currentDate->format('Y-m-d');
            
            // Find matching sales data
            $dayData = $salesData->firstWhere('date', $dateStr);
            $amount = $dayData ? (float)$dayData->total : 0;
            
            $weekData[] = [
                'day' => $currentDate->format('D'), // Wed, Thu, etc.
                'date' => $currentDate->format('M d'), // Feb 04
                'value' => $amount,
                'full_date' => $dateStr
            ];
            
            $totalRevenue += $amount;
        }

        return [
            'data' => $weekData,
            'total_revenue' => $totalRevenue,
            'start_date' => $startDate->format('M d, Y'),
            'end_date' => $endDate->format('M d, Y')
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