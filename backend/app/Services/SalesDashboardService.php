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

    public function getItemReport($fromDate, $toDate, $reportType = 'item-list')
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [
                \Carbon\Carbon::parse($fromDate)->startOfDay(),
                \Carbon\Carbon::parse($toDate)->endOfDay()
            ]);

        if ($reportType === 'category-summary') {
            $query->select(
                'categories.name as name', 
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.final_price) as amount')
            )->groupBy('categories.name');
        } else {
            $query->select(
                'sale_items.product_name as name',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.final_price) as amount')
            )->groupBy('sale_items.product_name');
        }

        $items = $query->get();

        return [
            'items' => $items,
            'total_qty' => $items->sum('qty'),
            'grand_total' => (float) $items->sum('amount')
        ];
    }

    public function getXReading($date)
    {
        $formattedDate = \Carbon\Carbon::parse($date)->format('Y-m-d');

        // Fetch all completed sales for the day
        $sales = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->get();

        $grossSales = $sales->sum('total_amount');
        $transactionCount = $sales->count();
        
        // Breakdown by Payment Method
        $cashSales = $sales->where('payment_method', 'cash')->sum('total_amount');
        $otherSales = $sales->where('payment_method', '!=', 'cash')->sum('total_amount');

        // Hourly Breakdown for the list
        $hourly = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('hour')
            ->get()
            ->map(function($item) {
                return [
                    'time' => \Carbon\Carbon::createFromTime($item->hour)->format('g A'),
                    'total' => (float)$item->total,
                    'count' => $item->count
                ];
            });

        return [
            'date' => $formattedDate,
            'gross_sales' => (float)$grossSales,
            'net_sales' => (float)$grossSales, // Adjust if you have tax/discounts
            'transaction_count' => $transactionCount,
            'cash_total' => (float)$cashSales,
            'non_cash_total' => (float)$otherSales,
            'hourly_data' => $hourly
        ];
    }
}