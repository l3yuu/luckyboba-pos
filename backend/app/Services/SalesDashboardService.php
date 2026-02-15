<?php

namespace App\Services;

use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SalesDashboardService
{
    public function getAnalyticsData()
    {
        $startOfWeek = Carbon::now()->subDays(7)->startOfDay();
        $today = Carbon::today();

        // 1. Weekly Sales
        $weekly = Sale::where('created_at', '>=', $startOfWeek)
            ->where('status', 'completed')
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%b %d") as date'),
                DB::raw('DATE_FORMAT(created_at, "%a") as day'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('date', 'day')
            ->orderBy('date', 'ASC')
            ->get();

        // 2. Today's Hourly Sales
        $todayHourly = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('hour')
            ->get()
            ->map(function ($item) {
                return [
                    'time' => Carbon::createFromTime($item->hour)->format('g A'),
                    'value' => (float) $item->value
                ];
            });

        // 3. Stats Summary
        $stats = [
            'total_revenue' => (float) ($weekly->sum('value') ?? 0),
            'today_sales' => (float) (Sale::whereDate('created_at', $today)
                ->where('status', 'completed')
                ->sum('total_amount') ?? 0),
            'cancelled_sales' => (float) (Sale::whereDate('created_at', $today)
                ->where('status', 'cancelled')
                ->sum('total_amount') ?? 0),
            'beginning_or' => Sale::whereDate('created_at', $today)->min('invoice_number') ?? '---',
            'ending_or' => Sale::whereDate('created_at', $today)->max('invoice_number') ?? '---',
        ];

        return [
            'weekly' => $weekly,
            'today_hourly' => $todayHourly,
            'stats' => $stats,
        ];
    }
}