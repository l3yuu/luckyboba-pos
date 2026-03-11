<?php

namespace App\Services;

use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\ZReading;

class SalesDashboardService
{
    // ─── Analytics (BranchManagerDashboard) ──────────────────────────────────

    /**
     * GET /api/sales-analytics
     *
     * Returns the full analytics payload consumed by BranchManagerDashboard.
     * Pass $branchId = null for superadmin (all branches).
     *
     * Response shape:
     * {
     *   weekly: [{ date, day, value }],
     *   stats: {
     *     cash_in_today, cash_out_today,
     *     total_sales_today, total_orders_today, voided_sales_today,
     *     top_seller_today:    [{ product_name, total_qty }],
     *     top_seller_all_time: [{ product_name, total_qty }],
     *   }
     * }
     */
    public function getAnalyticsData(?int $branchId = null): array
    {
        $today       = Carbon::today();
        $startOfWeek = Carbon::now()->subDays(6)->startOfDay(); // last 7 days incl. today

        // ── 7-day chart (daily points) ────────────────────────────────────────
        $weekly = Sale::where('created_at', '>=', $startOfWeek)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('DATE_FORMAT(created_at, "%a") as day'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('date', 'day')
            ->orderBy('date', 'ASC')
            ->get()
            ->map(fn($row) => [
                'date'  => $row->date,
                'day'   => $row->day,
                'value' => (float) $row->value,
            ]);

        // ── 30-day chart (daily points) ───────────────────────────────────────
        $start30 = Carbon::now()->subDays(29)->startOfDay();
        $monthly = Sale::where('created_at', '>=', $start30)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get()
            ->map(fn($row) => [
                'date'  => $row->date,
                'day'   => Carbon::parse($row->date)->format('M d'),
                'value' => (float) $row->value,
            ]);

        // ── 3-month chart (weekly buckets, Mon–Sun) ───────────────────────────
        $start3m = Carbon::now()->subMonths(3)->startOfDay();
        $quarterly = Sale::where('created_at', '>=', $start3m)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                // ISO week start (Monday) as the bucket key
                DB::raw('DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) as week_start'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('week_start')
            ->orderBy('week_start', 'ASC')
            ->get()
            ->map(fn($row) => [
                'date'  => $row->week_start,
                'day'   => 'Wk ' . Carbon::parse($row->week_start)->format('M d'),
                'value' => (float) $row->value,
            ]);

        // ── Today base query (reused below) ───────────────────────────────────
        $baseToday = fn() => DB::table('sales')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        // ── Yesterday base queries (for "vs yesterday" trends) ────────────────
        $yesterday         = Carbon::yesterday();
        $baseYest          = fn() => DB::table('sales')
            ->whereDate('created_at', $yesterday)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        $baseCashYest      = fn() => DB::table('cash_transactions')
            ->whereDate('created_at', $yesterday)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $cashInYesterday   = (float) ($baseCashYest)()->where('type', 'cash_in')->sum('amount');
        $cashOutYesterday  = (float) ($baseCashYest)()->whereIn('type', ['cash_out', 'cash_drop'])->sum('amount');
        $salesYesterday    = (float) ($baseYest)()->where('status', 'completed')->sum('total_amount');
        $voidedYesterday   = (float) ($baseYest)()->where('status', 'cancelled')->sum('total_amount');

        // ── Cash in / out today ───────────────────────────────────────────────
        // Both come from the cash_transactions table.
        // Types stored by CashTransactionController: 'cash_in' | 'cash_out' | 'cash_drop'
        // cash_in_today  = opening float / shift cash-in
        // cash_out_today = cash_out + cash_drop (any money removed from drawer)
        $baseCash = fn() => DB::table('cash_transactions')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $cashInToday = (float) ($baseCash)()
            ->where('type', 'cash_in')
            ->sum('amount');

        $cashOutToday = (float) ($baseCash)()
            ->whereIn('type', ['cash_out', 'cash_drop'])
            ->sum('amount');

        // ── Sales totals today ────────────────────────────────────────────────
        $totalSalesToday = (float) ($baseToday)()
            ->where('status', 'completed')
            ->sum('total_amount');

        $totalOrdersToday = (int) ($baseToday)()
            ->where('status', 'completed')
            ->count();

        $voidedSalesToday = (float) ($baseToday)()
            ->where('status', 'cancelled')
            ->sum('total_amount');

        // ── Top sellers today ─────────────────────────────────────────────────
        $topSellerToday = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $today)
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty')
            )
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        // ── Top sellers all-time ──────────────────────────────────────────────
        $topSellerAllTime = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty')
            )
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        // ── 7-day sparkline series (real data, gaps filled with 0) ────────────
        // Build a fixed 7-slot window: [6 days ago … today].
        // Any day with no records gets 0 — this is what the frontend renders.
        $last7Dates = collect(range(6, 0))->map(
            fn($d) => Carbon::now()->subDays($d)->toDateString()
        );

        $salesByDay = Sale::where('created_at', '>=', $startOfWeek)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('date')->pluck('total', 'date');

        $voidedByDay = Sale::where('created_at', '>=', $startOfWeek)
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('date')->pluck('total', 'date');

        $cashInByDay = DB::table('cash_transactions')
            ->where('created_at', '>=', $startOfWeek)
            ->where('type', 'cash_in')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as total'))
            ->groupBy('date')->pluck('total', 'date');

        $cashOutByDay = DB::table('cash_transactions')
            ->where('created_at', '>=', $startOfWeek)
            ->whereIn('type', ['cash_out', 'cash_drop'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as total'))
            ->groupBy('date')->pluck('total', 'date');

        // Map to ordered 7-element arrays; missing dates become 0
        $sparkSales   = $last7Dates->map(fn($d) => (float) ($salesByDay[$d]   ?? 0))->values()->all();
        $sparkVoided  = $last7Dates->map(fn($d) => (float) ($voidedByDay[$d]  ?? 0))->values()->all();
        $sparkCashIn  = $last7Dates->map(fn($d) => (float) ($cashInByDay[$d]  ?? 0))->values()->all();
        $sparkCashOut = $last7Dates->map(fn($d) => (float) ($cashOutByDay[$d] ?? 0))->values()->all();
        $sparkOverall = $last7Dates->map(fn($d) =>
            (float) ($cashInByDay[$d] ?? 0) + (float) ($salesByDay[$d] ?? 0) - (float) ($cashOutByDay[$d] ?? 0)
        )->values()->all();

        return [
            'weekly'    => $weekly,
            'monthly'   => $monthly,
            'quarterly' => $quarterly,
            'stats'  => [
                'cash_in_today'       => $cashInToday,
                'cash_out_today'      => $cashOutToday,
                'total_sales_today'   => $totalSalesToday,
                'total_orders_today'  => $totalOrdersToday,
                'voided_sales_today'  => $voidedSalesToday,

                // Overall cash in drawer: cash_in + sales_cash - cash_out/drop
                'overall_cash_today'  => $cashInToday + $totalSalesToday - $cashOutToday,
                'top_seller_today'    => $topSellerToday,
                'top_seller_all_time' => $topSellerAllTime,

                // Real 7-day sparkline arrays [oldest … today]
                'spark_cash_in'  => $sparkCashIn,
                'spark_cash_out' => $sparkCashOut,
                'spark_sales'    => $sparkSales,
                'spark_voided'   => $sparkVoided,
                'spark_overall'  => $sparkOverall,

                // Yesterday values — used by frontend to compute real "vs yesterday" trend
                'cash_in_yesterday'      => $cashInYesterday,
                'cash_out_yesterday'     => $cashOutYesterday,
                'sales_yesterday'        => $salesYesterday,
                'voided_yesterday'       => $voidedYesterday,
                'overall_cash_yesterday' => $cashInYesterday + $salesYesterday - $cashOutYesterday,

                // Legacy keys kept so older consumers don't break
                'total_revenue'   => (float) $weekly->sum('value'),
                'today_sales'     => $totalSalesToday,
                'cancelled_sales' => $voidedSalesToday,
                'beginning_or'    => Sale::whereDate('created_at', $today)
                                        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                                        ->min('invoice_number') ?? '---',
                'ending_or'       => Sale::whereDate('created_at', $today)
                                        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                                        ->max('invoice_number') ?? '---',
            ],
        ];
    }

    // ─── Items report ─────────────────────────────────────────────────────────

    public function getItemReport($fromDate, $toDate, $reportType = 'item-list'): array
    {
        $items = DB::table('sale_items')
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
            ->groupBy('sale_items.product_name')
            ->get();

        return [
            'items'       => $items,
            'total_qty'   => $items->sum('qty'),
            'grand_total' => (float) $items->sum('amount'),
        ];
    }

    // ─── X-Reading ────────────────────────────────────────────────────────────

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
            ->whereIn('type', ['cash_out', 'cash_drop'])
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

    // ─── Z-Reading ────────────────────────────────────────────────────────────

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

    // ── SI# from receipts table ──────────────────────────────────────────
    $begSI = DB::table('receipts')
        ->whereBetween('created_at', [$start, $end])
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
        ->orderBy('id', 'asc')
        ->value('si_number') ?? '0000000000';

    $endSI = DB::table('receipts')
        ->whereBetween('created_at', [$start, $end])
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
        ->orderBy('id', 'desc')
        ->value('si_number') ?? '0000000000';

    // ── Payment breakdown ────────────────────────────────────────────────
    $paymentBreakdown = DB::table('sales')
        ->whereBetween('created_at', [$start, $end])
        ->where('status', 'completed')
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
        ->select(DB::raw('payment_method as method'), DB::raw('SUM(total_amount) as amount'))
        ->groupBy('payment_method')
        ->get();

    // ── Discount breakdown ───────────────────────────────────────────────
    $baseDiscount = fn() => DB::table('sales')
        ->whereBetween('created_at', [$start, $end])
        ->where('status', 'completed')
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

    $scDiscount = (float) ($baseDiscount)()
        ->where('pax_senior', '>', 0)
        ->sum(DB::raw('(COALESCE(vatable_sales, total_amount / 1.12) / GREATEST(pax_regular + pax_senior + pax_pwd + pax_diplomat, 1)) * pax_senior * 0.20'));

    $pwdDiscount = (float) ($baseDiscount)()
        ->where('pax_pwd', '>', 0)
        ->sum(DB::raw('(COALESCE(vatable_sales, total_amount / 1.12) / GREATEST(pax_regular + pax_senior + pax_pwd + pax_diplomat, 1)) * pax_pwd * 0.20'));

    $diplomatDiscount = (float) ($baseDiscount)()
        ->where('pax_diplomat', '>', 0)
        ->sum(DB::raw('total_amount * 0.20'));

    // ── Total qty sold ───────────────────────────────────────────────────
    $totalQtySold = (int) DB::table('sale_items')
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->whereBetween('sales.created_at', [$start, $end])
        ->where('sales.status', 'completed')
        ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
        ->sum('sale_items.quantity');

    // ── Cash in / drop ───────────────────────────────────────────────────
    $cashIn = (float) DB::table('cash_transactions')
        ->whereBetween('created_at', [$start, $end])
        ->where('type', 'cash_in')
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
        ->sum('amount');

    $cashDrop = (float) DB::table('cash_transactions')
        ->whereBetween('created_at', [$start, $end])
        ->whereIn('type', ['cash_out', 'cash_drop'])
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
        ->sum('amount');

    // ── Category breakdown (grouped by product_name, no category/discount cols) ──
$categoryBreakdown = DB::table('sale_items')
    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
    ->whereBetween('sales.created_at', [$start, $end])
    ->where('sales.status', 'completed')
    ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
    ->select(
        DB::raw('COALESCE(sale_items.cup_size_label, "NO SIZE") as category_name'),
        DB::raw('SUM(sale_items.quantity) as total_qty'),
        DB::raw('0 as total_disc'),
        DB::raw('SUM(sale_items.final_price) as total_sold')
    )
    ->groupBy('sale_items.cup_size_label')
    ->get();

    $reportData = [
        'from_date'          => $start->toDateString(),
        'to_date'            => $end->toDateString(),
        'branch_id'          => $branchId,
        'gross_sales'        => $gross,
        'net_sales'          => $gross,
        'transaction_count'  => $sales->count(),
        'cash_total'         => $cash,
        'non_cash_total'     => $gross - $cash,
        'total_void_amount'  => $voidAmount,
        'vatable_sales'      => $vatableSales,
        'vat_amount'         => $vatAmount,
        'beg_si'             => $begSI,   // ← now populated
        'end_si'             => $endSI,   // ← now populated
        'payment_breakdown'  => $paymentBreakdown,
        'sc_discount'        => round($scDiscount, 2),
        'pwd_discount'       => round($pwdDiscount, 2),
        'diplomat_discount'  => round($diplomatDiscount, 2),
        'total_qty_sold'     => $totalQtySold,
        'cash_in'            => $cashIn,
        'cash_drop'          => $cashDrop,
        'cash_in_drawer'     => $cashIn + $cash - $cashDrop,
        'category_breakdown' => $categoryBreakdown,
        'generated_at'       => now()->toDateTimeString(),
    ];

    if ($from === $to) {
        ZReading::updateOrCreate(
            ['reading_date' => $start->toDateString()],
            ['total_sales' => $gross, 'data' => $reportData]
        );
    }

    return $reportData;
}

    // ─── Mall accreditation report ────────────────────────────────────────────

    public function getMallReport(string $date, string $mallName, ?int $branchId = null): array
    {
        $from = Carbon::parse($date)->startOfDay();
        $to   = Carbon::parse($date)->endOfDay();

        $sales = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        $gross    = (float) $sales->sum('total_amount');
        $netSales = round($gross / 1.12, 2);
        $tax      = round($gross - $netSales, 2);

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