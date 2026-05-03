<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardService
{
    public function getHomeStats(?int $branchId = null)
    {
        $today = Carbon::today();
        $startOfDay = $today->toDateTimeString();
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        $cashQuery = CashTransaction::whereHas('branch')
            ->whereBetween('created_at', [$startOfDay, $endOfDay]);
        if ($branchId) {
            $cashQuery->where('branch_id', $branchId);
        }
        $cashStats = $cashQuery->selectRaw("
            SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END) as cash_in,
            SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END) as cash_out
        ")->first();

        $saleQuery = Sale::whereHas('branch')
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('status', 'completed');

        if ($branchId) {
            $saleQuery->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                ->orWhere('invoice_number', 'like', 'APP-%');
                
            });
        }

        $saleStats = $saleQuery->selectRaw("SUM(total_amount) as total_sales, COUNT(*) as total_orders")->first();


        $voidedQuery = Sale::whereHas('branch')
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('status', 'cancelled');

            if ($branchId) {
                $voidedQuery->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                    ->orWhere('invoice_number', 'like', 'APP-%');
                });
            }

        $voidedSales = $voidedQuery->sum('total_amount');

        return [
            'cash_in_today'       => $cashStats->cash_in ?? 0,
            'cash_out_today'      => $cashStats->cash_out ?? 0,
            'total_sales_today'   => $saleStats->total_sales ?? 0,
            'total_orders_today'  => $saleStats->total_orders ?? 0,
            'voided_sales_today'  => $voidedSales ?? 0,
            'top_seller_today'    => $this->getTopSellerToday($startOfDay, $endOfDay, $branchId),
            'top_seller_all_time' => $this->getTopSellerAllTime($branchId),
        ];
    }

    private function getTopSellerToday(string $start, string $end, ?int $branchId = null)
    {
        try {
            $query = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('branches', 'sales.branch_id', '=', 'branches.id')
                ->whereNull('branches.deleted_at')
                ->where('sales.status', 'completed')
                ->where('sales.status', '!=', 'cancelled')
                ->whereBetween('sales.created_at', [$start, $end]);  // ← more reliable

           if ($branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('sales.branch_id', $branchId)
                ->orWhere('sales.invoice_number', 'like', 'APP-%');
            });
        }

            return $query->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
                ->groupBy('sale_items.product_name')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    private function getTopSellerAllTime(?int $branchId = null)
{
    $cacheKey = $branchId ? "top_seller_all_time_branch_{$branchId}" : 'top_seller_all_time';

    return Cache::remember($cacheKey, 3600, function () use ($branchId) {
        try {
            $query = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('branches', 'sales.branch_id', '=', 'branches.id')
                ->whereNull('branches.deleted_at')
                ->where('sales.status', 'completed');

            if ($branchId) {
                $query->where(function ($q) use ($branchId) {
                    $q->where('sales.branch_id', $branchId)
                      ->orWhere('sales.invoice_number', 'like', 'APP-%');
                });
            }

            return $query->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
                ->groupBy('sale_items.product_name')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();

        } catch (\Exception $e) {
            return collect([]);
        }
    });
}

    public function clearTodayCache(?int $branchId = null)
    {
        Cache::forget('top_seller_all_time');
        if ($branchId) {
            Cache::forget("top_seller_all_time_branch_{$branchId}");
        }
    }
    
    public function clearAllTimeCache(?int $branchId = null)
    {
        Cache::forget('top_seller_all_time'); // global
        if ($branchId) {
            Cache::forget("top_seller_all_time_branch_{$branchId}");
        }
    }

    public function getTodayTotals()
    {
        return DB::table('sales')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->whereNull('branches.deleted_at')
            ->whereDate('sales.created_at', now()->today())
            ->where('sales.status', 'completed')
            ->select(
                DB::raw('SUM(sales.total_amount) as total_revenue'),
                DB::raw('COUNT(sales.id) as total_transactions')
            )
            ->first();
    }

    public function getWeeklySalesData()
    {
        $currentWeekStart = Carbon::now()->startOfWeek(1); // 1 = Monday
        $currentWeekEnd = Carbon::now()->endOfWeek(0);   // 0 = Sunday

        $startDate = $currentWeekStart->copy();
        $endDate = $currentWeekEnd->copy();

        $salesData = Sale::whereHas('branch')
            ->select(
                DB::raw('DATE(sales.created_at) as date'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->groupBy(DB::raw('DATE(sales.created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        $weekData = [];
        $totalRevenue = 0;
        $currentDay = $currentWeekStart->copy();

        for ($i = 0; $i < 7; $i++) {
            $dateStr = $currentDay->format('Y-m-d');
            $dayData = $salesData->firstWhere('date', $dateStr);
            $amount = $dayData ? (float)$dayData->total : 0;

            $weekData[] = [
                'day'       => $currentDay->format('D'),
                'date'      => $currentDay->format('M d'),
                'value'     => $amount,
                'full_date' => $dateStr
            ];

            $totalRevenue += $amount;
            $currentDay->addDay();
        }

        return [
            'data'               => $weekData,
            'total_revenue'      => $totalRevenue,
            'start_date'         => $currentWeekStart->format('M d, Y'),
            'end_date'           => $currentWeekEnd->format('M d, Y'),
            'current_week_start' => $currentWeekStart->format('Y-m-d'),
        ];
    }

    public function getTodayHourlySales()
    {
        $today = Carbon::today();
        $startOfDay = $today->toDateTimeString();
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        $salesData = Sale::whereHas('branch')
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour', 'asc')
            ->get();

        $intervals = [
            ['time' => '10 AM', 'start' => 10, 'end' => 11],
            ['time' => '12 PM', 'start' => 12, 'end' => 13],
            ['time' => '2 PM',  'start' => 14, 'end' => 15],
            ['time' => '4 PM',  'start' => 16, 'end' => 17],
            ['time' => '6 PM',  'start' => 18, 'end' => 19],
            ['time' => '8 PM',  'start' => 20, 'end' => 21],
        ];

        $hourlyData = [];

        foreach ($intervals as $interval) {
            $total = 0;
            foreach ($salesData as $sale) {
                if ($sale->hour >= $interval['start'] && $sale->hour <= $interval['end']) {
                    $total += (float)$sale->total;
                }
            }
            $hourlyData[] = [
                'time'  => $interval['time'],
                'value' => $total
            ];
        }

        return [
            'data' => $hourlyData,
            'date' => $today->format('M d, Y')
        ];
    }

    public function getSalesStatistics()
    {
        $today = Carbon::today();
        $startOfDay = $today->toDateTimeString();
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        $stats = Sale::whereHas('branch')
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
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

        $beginningORFormatted = $beginningOR ? str_pad($beginningOR, 9, '0', STR_PAD_LEFT) : '000000000';
        $endingORFormatted = $endingOR ? str_pad($endingOR, 9, '0', STR_PAD_LEFT) : '000000000';

        return [
            'beginning_sales' => 0.00,
            'today_sales'     => $todayTotal,
            'ending_sales'    => $todayTotal,
            'cancelled_sales' => $cancelledSales,
            'beginning_or'    => $beginningORFormatted,
            'ending_or'       => $endingORFormatted
        ];
    }
}