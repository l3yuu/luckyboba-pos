<?php

namespace App\Services;

use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\ZReading;

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
        ->where('sales.status', 'completed')
        ->whereBetween('sales.created_at', [
            \Carbon\Carbon::parse($fromDate)->startOfDay(),
            \Carbon\Carbon::parse($toDate)->endOfDay()
        ]);

    // category-summary falls back to item-list since there's no category join available
    $query->select(
        'sale_items.product_name as name',
        DB::raw('SUM(sale_items.quantity) as qty'),
        DB::raw('SUM(sale_items.final_price) as amount')
    )->groupBy('sale_items.product_name');

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

    public function generateZReading($date)
    {
        $formattedDate = \Carbon\Carbon::parse($date)->format('Y-m-d');

        // Fetch sales - ensure it handles empty collections
        $sales = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->get();

        // Use null coalescing (?? 0) to ensure numbers are returned
        $gross = (float)($sales->sum('total_amount') ?? 0);
        $cash = (float)($sales->where('payment_method', 'cash')->sum('total_amount') ?? 0);

        $reportData = [
            'reading_date'      => $formattedDate,
            'gross_sales'       => $gross,
            'net_sales'         => $gross,
            'transaction_count' => $sales->count() ?? 0,
            'cash_total'        => $cash,
            'non_cash_total'    => $gross - $cash,
            'generated_at'      => now()->toDateTimeString(),
        ];

        // Use updateOrCreate to avoid duplicate key errors
        ZReading::updateOrCreate(
            ['reading_date' => $formattedDate],
            [
                'total_sales' => $gross,
                'data' => $reportData,
            ]
        );

        return $reportData;
    }

    public function getMallReport($date, $mallName)
    {
        $formattedDate = \Carbon\Carbon::parse($date)->format('Y-m-d');

        // Fetch sales for that specific mall (if multi-branch) or just for that date
        $sales = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->get();

        $gross = (float)$sales->sum('total_amount');
        $count = $sales->count();
        
        // Most malls require Tax and Discount breakdowns
        $tax = $gross * 0.12; // Assuming 12% VAT
        $netSales = $gross - $tax;

        return [
            'mall' => $mallName,
            'date' => $formattedDate,
            'gross_sales' => $gross,
            'net_sales' => $netSales,
            'tax_amount' => $tax,
            'transaction_count' => $count,
            'tenant_id' => 'LUCKYBOBA-001', // Example ID
            'generated_at' => now()->toDateTimeString(),
        ];
    }
}