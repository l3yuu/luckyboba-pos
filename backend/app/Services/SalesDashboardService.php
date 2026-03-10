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
                    'time'  => Carbon::createFromTime($item->hour)->format('g A'),
                    'value' => (float) $item->value,
                ];
            });

        $stats = [
            'total_revenue'   => (float) ($weekly->sum('value') ?? 0),
            'today_sales'     => (float) (Sale::whereDate('created_at', $today)->where('status', 'completed')->sum('total_amount') ?? 0),
            'cancelled_sales' => (float) (Sale::whereDate('created_at', $today)->where('status', 'cancelled')->sum('total_amount') ?? 0),
            'beginning_or'    => Sale::whereDate('created_at', $today)->min('invoice_number') ?? '---',
            'ending_or'       => Sale::whereDate('created_at', $today)->max('invoice_number') ?? '---',
        ];

        return [
            'weekly'       => $weekly,
            'today_hourly' => $todayHourly,
            'stats'        => $stats,
        ];
    }

    public function getItemReport($fromDate, $toDate, $reportType = 'item-list')
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [
                Carbon::parse($fromDate)->startOfDay(),
                Carbon::parse($toDate)->endOfDay(),
            ])
            ->select(
                'sale_items.product_name as name',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.final_price) as amount')
            )
            ->groupBy('sale_items.product_name');

        $items = $query->get();

        return [
            'items'       => $items,
            'total_qty'   => $items->sum('qty'),
            'grand_total' => (float) $items->sum('amount'),
        ];
    }

    // ─── X-Reading: single date, branch-filtered ──────────────────────────────

    public function getXReading(string $date, ?string $toDate = null, ?int $branchId = null): array
    {
        $from = Carbon::parse($date)->startOfDay();
        $to   = $toDate ? Carbon::parse($toDate)->endOfDay() : Carbon::parse($date)->endOfDay();

        $salesQuery = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $sales            = $salesQuery->get();
        $grossSales       = (float) $sales->sum('total_amount');
        $transactionCount = $sales->count();
        $cashSales        = (float) $sales->where('payment_method', 'cash')->sum('total_amount');
        $otherSales       = $grossSales - $cashSales;

        $begSI = DB::table('receipts')
            ->whereBetween('created_at', [$from, $to])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->orderBy('id', 'asc')
            ->value('si_number') ?? '0000000000';

        $endSI = DB::table('receipts')
            ->whereBetween('created_at', [$from, $to])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->orderBy('id', 'desc')
            ->value('si_number') ?? '0000000000';

        $voidCount = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        $voidAmount = (float) DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        $vatableSales = round($grossSales / 1.12, 2);
        $vatAmount    = round($grossSales - $vatableSales, 2);

        $baseDiscountQuery = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $scDiscount = (float) (clone $baseDiscountQuery)
            ->where('pax_senior', '>', 0)
            ->sum(DB::raw('(COALESCE(vatable_sales, total_amount / 1.12) / GREATEST(pax_regular + pax_senior + pax_pwd + pax_diplomat, 1)) * pax_senior * 0.20'));

        $pwdDiscount = (float) (clone $baseDiscountQuery)
            ->where('pax_pwd', '>', 0)
            ->sum(DB::raw('(COALESCE(vatable_sales, total_amount / 1.12) / GREATEST(pax_regular + pax_senior + pax_pwd + pax_diplomat, 1)) * pax_pwd * 0.20'));

        $diplomatDiscount = (float) (clone $baseDiscountQuery)
            ->where('pax_diplomat', '>', 0)
            ->sum(DB::raw('total_amount * 0.20'));

        $paymentBreakdown = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('payment_method as method'), DB::raw('SUM(total_amount) as amount'))
            ->groupBy('payment_method')
            ->get();

        $hourly = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('hour')
            ->get()
            ->map(fn($item) => [
                'time'  => Carbon::createFromTime($item->hour)->format('g A'),
                'total' => (float) $item->total,
                'count' => $item->count,
            ]);

        $totalQtySold = (int) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$from, $to])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->sum('sale_items.quantity');

        $cashIn = (float) DB::table('cash_transactions')
            ->whereBetween('created_at', [$from, $to])
            ->where('type', 'cash_in')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('amount');

        $cashDrop = (float) DB::table('cash_transactions')
            ->whereBetween('created_at', [$from, $to])
            ->where('type', 'cash_drop')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('amount');

        return [
            'date'              => $from->toDateString(),
            'to_date'           => $to->toDateString(),
            'gross_sales'       => $grossSales,
            'net_sales'         => $grossSales,
            'transaction_count' => $transactionCount,
            'cash_total'        => $cashSales,
            'non_cash_total'    => $otherSales,
            'hourly_data'       => $hourly,
            'beg_si'            => $begSI,
            'end_si'            => $endSI,
            'void_count'        => $voidCount,
            'total_void_amount' => $voidAmount,
            'vatable_sales'     => $vatableSales,
            'vat_amount'        => $vatAmount,
            'sc_discount'       => round($scDiscount,       2),
            'pwd_discount'      => round($pwdDiscount,      2),
            'diplomat_discount' => round($diplomatDiscount, 2),
            'payment_breakdown' => $paymentBreakdown,
            'total_qty_sold'    => $totalQtySold,
            'cash_in'           => $cashIn,
            'cash_in_drawer'    => $cashIn + $cashSales - $cashDrop,
            'cash_drop'         => $cashDrop,
        ];
    }

    // ─── Z-Reading: date range, branch-filtered ───────────────────────────────

    public function generateZReading(string $from, string $to, ?int $branchId = null): array
    {
        $start = Carbon::parse($from)->startOfDay();
        $end   = Carbon::parse($to)->endOfDay();

        $sales = DB::table('sales')
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        $gross = (float) $sales->sum('total_amount');
        $cash  = (float) $sales->where('payment_method', 'cash')->sum('total_amount');

        $voidAmount = (float) DB::table('sales')
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        $vatableSales = round($gross / 1.12, 2);
        $vatAmount    = round($gross - $vatableSales, 2);

        $reportData = [
            'from_date'         => $start->toDateString(),
            'to_date'           => $end->toDateString(),
            'branch_id'         => $branchId,
            'gross_sales'       => $gross,
            'net_sales'         => $gross,
            'transaction_count' => $sales->count(),
            'cash_total'        => $cash,
            'non_cash_total'    => $gross - $cash,
            'total_void_amount' => $voidAmount,
            'vatable_sales'     => $vatableSales,
            'vat_amount'        => $vatAmount,
            'generated_at'      => now()->toDateTimeString(),
        ];

        // Only persist single-day Z-Readings (daily EOD)
        if ($from === $to) {
            ZReading::updateOrCreate(
                [
                    'reading_date' => $start->toDateString(),
                    // add branch_id to unique key if your z_readings table has that column:
                    // 'branch_id'    => $branchId,
                ],
                [
                    'total_sales' => $gross,
                    'data'        => $reportData,
                ]
            );
        }

        return $reportData;
    }

    public function getMallReport(string $date, string $mallName, ?int $branchId = null): array
    {
        $from = Carbon::parse($date)->startOfDay();
        $to   = Carbon::parse($date)->endOfDay();

        $sales = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        $gross   = (float) $sales->sum('total_amount');
        $tax     = round($gross / 1.12 * 0.12, 2);   // VAT portion
        $netSales = round($gross / 1.12, 2);

        return [
            'mall'              => $mallName,
            'date'              => Carbon::parse($date)->toDateString(),
            'branch_id'         => $branchId,
            'gross_sales'       => $gross,
            'net_sales'         => $netSales,
            'tax_amount'        => $tax,
            'transaction_count' => $sales->count(),
            'tenant_id'         => 'LUCKYBOBA-001',
            'generated_at'      => now()->toDateTimeString(),
        ];
    }
}