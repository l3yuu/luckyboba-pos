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

        $sales = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->get();

        $grossSales       = $sales->sum('total_amount');
        $transactionCount = $sales->count();
        $cashSales        = $sales->where('payment_method', 'cash')->sum('total_amount');
        $otherSales       = $sales->where('payment_method', '!=', 'cash')->sum('total_amount');

        // ── ADD THESE ──────────────────────────────────────────────
        $begSI = DB::table('receipts')
            ->whereDate('created_at', $formattedDate)
            ->orderBy('id', 'asc')
            ->value('si_number') ?? '0000000000';

        $endSI = DB::table('receipts')
            ->whereDate('created_at', $formattedDate)
            ->orderBy('id', 'desc')
            ->value('si_number') ?? '0000000000';

        $voidCount  = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'cancelled')
            ->count();

        $voidAmount = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'cancelled')
            ->sum('total_amount');

        $vatableSales = round($grossSales / 1.12, 2);
        $vatAmount    = round($grossSales - $vatableSales, 2);

        $scDiscount = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->where('pax_senior', '>', 0)
            ->sum(DB::raw('(COALESCE(vatable_sales, total_amount / 1.12) / GREATEST(pax_regular + pax_senior + pax_pwd + pax_diplomat, 1)) * pax_senior * 0.20'));

        $pwdDiscount = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->where('pax_pwd', '>', 0)
            ->sum(DB::raw('(COALESCE(vatable_sales, total_amount / 1.12) / GREATEST(pax_regular + pax_senior + pax_pwd + pax_diplomat, 1)) * pax_pwd * 0.20'));

        $diplomatDiscount = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->where('pax_diplomat', '>', 0)
            ->sum(DB::raw('total_amount * 0.20'));

        $paymentBreakdown = DB::table('sales')
            ->whereDate('created_at', $formattedDate)
            ->where('status', 'completed')
            ->select(DB::raw('payment_method as method'), DB::raw('SUM(total_amount) as amount'))
            ->groupBy('payment_method')
            ->get();
        // ───────────────────────────────────────────────────────────

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
                    'time'  => \Carbon\Carbon::createFromTime($item->hour)->format('g A'),
                    'total' => (float)$item->total,
                    'count' => $item->count,
                ];
            });

            // Total qty sold
            $totalQtySold = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereDate('sales.created_at', $formattedDate)
                ->where('sales.status', 'completed')
                ->sum('sale_items.quantity');

            $cashIn = DB::table('cash_transactions')
                ->whereDate('created_at', $formattedDate)
                ->where('type', 'cash_in')
                ->sum('amount');

            $cashDrop = DB::table('cash_transactions')
                ->whereDate('created_at', $formattedDate)
                ->where('type', 'cash_drop')
                ->sum('amount');

            $cashInDrawer = $cashIn + $cashSales - $cashDrop;

        return [
            'date'              => $formattedDate,
            'gross_sales'       => (float)$grossSales,
            'net_sales'         => (float)$grossSales,
            'transaction_count' => $transactionCount,
            'cash_total'        => (float)$cashSales,
            'non_cash_total'    => (float)$otherSales,
            'hourly_data'       => $hourly,
            'beg_si'            => $begSI,
            'end_si'            => $endSI,
            'void_count'        => (int)$voidCount,
            'total_void_amount' => (float)$voidAmount,
            'vatable_sales'     => $vatableSales,
            'vat_amount'        => $vatAmount,
            'sc_discount'       => round((float)$scDiscount,       2),
            'pwd_discount'      => round((float)$pwdDiscount,      2),
            'diplomat_discount' => round((float)$diplomatDiscount, 2),
            'payment_breakdown' => $paymentBreakdown,
            'prepared_by'       => auth()->user()->name ?? 'System Admin',
            'total_qty_sold' => (int)$totalQtySold,
            'cash_in'        => (float)$cashIn,
            'cash_in_drawer' => (float)$cashInDrawer,
            'cash_drop'      => (float)$cashDrop,
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