<?php

namespace App\Services;

use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\ZReading;

class SalesDashboardService
{
    // ─── Analytics (BranchManagerDashboard) ──────────────────────────────────

    public function getAnalyticsData(?int $branchId = null): array
    {
        $today       = Carbon::today();
        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();

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

        $start3m = Carbon::now()->subMonths(3)->startOfDay();
        $quarterly = Sale::where('created_at', '>=', $start3m)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
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

        $baseToday = fn() => DB::table('sales')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $yesterday        = Carbon::yesterday();
        $baseYest         = fn() => DB::table('sales')
            ->whereDate('created_at', $yesterday)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        $baseCashYest     = fn() => DB::table('cash_transactions')
            ->whereDate('created_at', $yesterday)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $cashInYesterday  = (float) ($baseCashYest)()->where('type', 'cash_in')->sum('amount');
        $cashOutYesterday = (float) ($baseCashYest)()->whereIn('type', ['cash_out', 'cash_drop'])->sum('amount');
        $salesYesterday   = (float) ($baseYest)()->where('status', 'completed')->sum('total_amount');
        $voidedYesterday  = (float) ($baseYest)()->where('status', 'cancelled')->sum('total_amount');

        $baseCash = fn() => DB::table('cash_transactions')
            ->whereDate('created_at', $today)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $cashInToday      = (float) ($baseCash)()->where('type', 'cash_in')->sum('amount');
        $cashOutToday     = (float) ($baseCash)()->whereIn('type', ['cash_out', 'cash_drop'])->sum('amount');
        $totalSalesToday  = (float) ($baseToday)()->where('status', 'completed')->sum('total_amount');
        $totalOrdersToday = (int)   ($baseToday)()->where('status', 'completed')->count();
        $voidedSalesToday = (float) ($baseToday)()->where('status', 'cancelled')->sum('total_amount');

        $topSellerToday = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $today)
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        $topSellerAllTime = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

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
                'cash_in_today'          => $cashInToday,
                'cash_out_today'         => $cashOutToday,
                'total_sales_today'      => $totalSalesToday,
                'total_orders_today'     => $totalOrdersToday,
                'voided_sales_today'     => $voidedSalesToday,
                'overall_cash_today'     => $cashInToday + $totalSalesToday - $cashOutToday,
                'top_seller_today'       => $topSellerToday,
                'top_seller_all_time'    => $topSellerAllTime,
                'spark_cash_in'          => $sparkCashIn,
                'spark_cash_out'         => $sparkCashOut,
                'spark_sales'            => $sparkSales,
                'spark_voided'           => $sparkVoided,
                'spark_overall'          => $sparkOverall,
                'cash_in_yesterday'      => $cashInYesterday,
                'cash_out_yesterday'     => $cashOutYesterday,
                'sales_yesterday'        => $salesYesterday,
                'voided_yesterday'       => $voidedYesterday,
                'overall_cash_yesterday' => $cashInYesterday + $salesYesterday - $cashOutYesterday,
                'total_revenue'          => (float) $weekly->sum('value'),
                'today_sales'            => $totalSalesToday,
                'cancelled_sales'        => $voidedSalesToday,
                'beginning_or'           => Sale::whereDate('created_at', $today)
                                               ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                                               ->min('invoice_number') ?? '---',
                'ending_or'              => Sale::whereDate('created_at', $today)
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

        // ── VAT type check ────────────────────────────────────────────────────
        $isVat = true;
        if ($branchId) {
            $branch = \App\Models\Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }
        // ─────────────────────────────────────────────────────────────────────

        $salesQuery = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $sales            = $salesQuery->get();
        $grossSales       = (float) $sales->sum('total_amount');
        $transactionCount = $sales->count();

        $cashSales = (float) DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where(fn($q) => $q->whereNull('charge_type')->orWhere('charge_type', ''))
            ->whereNotIn(DB::raw('LOWER(TRIM(payment_method))'), [
                'gcash', 'e-wallet', 'ewallet', 'visa', 'mastercard',
                'master card', 'master', 'visa card',
            ])
            ->sum('total_amount');

        $otherSales = $grossSales - $cashSales;

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

        // ── VAT calculation based on branch type ──────────────────────────────
        $vatableSales   = $isVat ? round($grossSales / 1.12, 2) : 0.0;
        $vatAmount      = $isVat ? round($grossSales - $vatableSales, 2) : 0.0;
        $vatExemptSales = $isVat ? 0.0 : $grossSales;
        // ─────────────────────────────────────────────────────────────────────

        // ── Discounts via shared helper ───────────────────────────────────────
        $discounts = $this->computeDiscounts($from, $to, $branchId);

        $paymentBreakdown = $this->computePaymentBreakdown($from, $to, $branchId);

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
            'vat_exempt_sales'  => $vatExemptSales,   // ← new
            'is_vat'            => $isVat,             // ← new
            'sc_discount'       => $discounts['sc_discount'],
            'pwd_discount'      => $discounts['pwd_discount'],
            'diplomat_discount' => $discounts['diplomat_discount'],
            'other_discount'    => $discounts['other_discount'],
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

        // ── VAT type check ────────────────────────────────────────────────────
        $isVat = true;
        if ($branchId) {
            $branch = \App\Models\Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }
        // ─────────────────────────────────────────────────────────────────────

        $sales = DB::table('sales')
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        $gross = (float) $sales->sum('total_amount');

        $cash = (float) DB::table('sales')
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where(fn($q) => $q->whereNull('charge_type')->orWhere('charge_type', ''))
            ->whereNotIn(DB::raw('LOWER(TRIM(payment_method))'), [
                'gcash', 'e-wallet', 'ewallet', 'visa', 'mastercard',
                'master card', 'master', 'visa card',
            ])
            ->sum('total_amount');

        $voidAmount = (float) DB::table('sales')
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        // ── VAT calculation based on branch type ──────────────────────────────
        $vatableSales   = $isVat ? round($gross / 1.12, 2) : 0.0;
        $vatAmount      = $isVat ? round($gross - $vatableSales, 2) : 0.0;
        $vatExemptSales = $isVat ? 0.0 : $gross;
        // ─────────────────────────────────────────────────────────────────────

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

        // ── Discounts & payment via shared helpers ────────────────────────────
        $discounts        = $this->computeDiscounts($start, $end, $branchId);
        $paymentBreakdown = $this->computePaymentBreakdown($start, $end, $branchId);

        $totalQtySold = (int) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$start, $end])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->sum('sale_items.quantity');

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
            'vat_exempt_sales'   => $vatExemptSales,   // ← new
            'is_vat'             => $isVat,             // ← new
            'beg_si'             => $begSI,
            'end_si'             => $endSI,
            'payment_breakdown'  => $paymentBreakdown,
            'sc_discount'        => $discounts['sc_discount'],
            'pwd_discount'       => $discounts['pwd_discount'],
            'diplomat_discount'  => $discounts['diplomat_discount'],
            'other_discount'     => $discounts['other_discount'],
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

    // ─── Discount summary (standalone public report) ──────────────────────────

    public function getDiscountSummary(string $fromDate, string $toDate, ?int $branchId = null): array
    {
        $from = Carbon::parse($fromDate)->startOfDay();
        $to   = Carbon::parse($toDate)->endOfDay();

        $discounts = $this->computeDiscounts($from, $to, $branchId);

        // ── Per-label breakdown of "other" item-level discounts ───────────────
        $otherItemLevelBreakdown = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$from, $to])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->where('sale_items.discount_label', 'NOT LIKE', '%SENIOR%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%PWD%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%DIPLOMAT%')
            ->whereNotNull('sale_items.discount_label')
            ->where('sale_items.discount_label', '!=', '')
            ->select(
                'sale_items.discount_label as label',
                DB::raw('SUM(sale_items.discount_amount) as total_discount'),
                DB::raw('COUNT(DISTINCT sales.id) as transaction_count')
            )
            ->groupBy('sale_items.discount_label')
            ->orderByDesc('total_discount')
            ->get();

        // ── Order-level promo discount breakdown by discount name ─────────────
        $orderLevelBreakdown = DB::table('sales')
            ->join('discounts', 'sales.discount_id', '=', 'discounts.id')
            ->whereBetween('sales.created_at', [$from, $to])
            ->where('sales.status', 'completed')
            ->whereNotNull('sales.discount_id')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'discounts.name as label',
                'discounts.type',
                'discounts.amount as rate',
                DB::raw('SUM(sales.discount_amount) as total_discount'),
                DB::raw('COUNT(sales.id) as transaction_count')
            )
            ->groupBy('discounts.id', 'discounts.name', 'discounts.type', 'discounts.amount')
            ->orderByDesc('total_discount')
            ->get();

        // ── PAX counts ────────────────────────────────────────────────────────
        $paxTotals = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->selectRaw('SUM(pax_senior) as total_senior_pax, SUM(pax_pwd) as total_pwd_pax')
            ->first();

        // ── Gross sales (for discount rate context) ───────────────────────────
        $grossSales = (float) DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        $grandTotal = $discounts['sc_discount']
            + $discounts['pwd_discount']
            + $discounts['diplomat_discount']
            + $discounts['other_discount'];

        return [
            'from_date'   => $from->toDateString(),
            'to_date'     => $to->toDateString(),
            'branch_id'   => $branchId,
            'gross_sales' => $grossSales,
            'sc_discount' => [
                'total'      => $discounts['sc_discount'],
                'pax_count'  => (int) ($paxTotals->total_senior_pax ?? 0),
            ],
            'pwd_discount' => [
                'total'      => $discounts['pwd_discount'],
                'pax_count'  => (int) ($paxTotals->total_pwd_pax ?? 0),
            ],
            'diplomat_discount' => [
                'total'      => $discounts['diplomat_discount'],
            ],
            'other_discount' => [
                'total'               => $discounts['other_discount'],
                'item_level_breakdown'  => $otherItemLevelBreakdown,
                'order_level_breakdown' => $orderLevelBreakdown,
            ],
            'grand_total_discount' => round($grandTotal, 2),
            'discount_rate_pct'    => $grossSales > 0
                ? round(($grandTotal / $grossSales) * 100, 2)
                : 0.0,
        ];
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Shared discount computation used by getXReading, generateZReading,
     * and getDiscountSummary so the logic lives in exactly one place.
     */
    private function computeDiscounts(
    Carbon $from,
    Carbon $to,
    ?int $branchId
): array {
    // ── Item-level discounts (from sale_items.discount_label) ─────────────
    $base = DB::table('sale_items')
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->whereBetween('sales.created_at', [$from, $to])
        ->where('sales.status', 'completed')
        ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId));

    $scItem = (float) (clone $base)
        ->where('sale_items.discount_label', 'LIKE', '%SENIOR%')
        ->sum('sale_items.discount_amount');

    $pwdItem = (float) (clone $base)
        ->where('sale_items.discount_label', 'LIKE', '%PWD%')
        ->sum('sale_items.discount_amount');

    $diplomatItem = (float) (clone $base)
        ->where('sale_items.discount_label', 'LIKE', '%DIPLOMAT%')
        ->sum('sale_items.discount_amount');

    $itemLevelOther = (float) (clone $base)
        ->where('sale_items.discount_label', 'NOT LIKE', '%SENIOR%')
        ->where('sale_items.discount_label', 'NOT LIKE', '%PWD%')
        ->where('sale_items.discount_label', 'NOT LIKE', '%DIPLOMAT%')
        ->whereNotNull('sale_items.discount_label')
        ->where('sale_items.discount_label', '!=', '')
        ->sum('sale_items.discount_amount');

    // ── Order-level discounts (use pre-split columns saved at transaction time)
    $orderBase = DB::table('sales')
        ->whereBetween('created_at', [$from, $to])
        ->where('status', 'completed')
        ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

    $scOrder       = (float) (clone $orderBase)->sum('sc_discount_amount');
    $pwdOrder      = (float) (clone $orderBase)->sum('pwd_discount_amount');
    $diplomatOrder = (float) (clone $orderBase)->sum('diplomat_discount_amount');
    $otherOrder    = (float) (clone $orderBase)->sum('other_discount_amount');

    return [
        'sc_discount'       => round($scItem      + $scOrder,        2),
        'pwd_discount'      => round($pwdItem      + $pwdOrder,       2),
        'diplomat_discount' => round($diplomatItem + $diplomatOrder,  2),
        'other_discount'    => round($itemLevelOther + $otherOrder,   2),
    ];
}

    /**
     * Shared payment breakdown used by getXReading and generateZReading.
     */
    private function computePaymentBreakdown(Carbon $from, Carbon $to, ?int $branchId): \Illuminate\Support\Collection
    {
        $branchCondition = $branchId ? "AND branch_id = {$branchId}" : "";

        return collect(DB::select("
            SELECT method, SUM(total_amount) as amount
            FROM (
                SELECT
                    CASE
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('panda','foodpanda','food_panda','food panda') THEN 'food panda'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('grab','grabfood','grab food')                THEN 'grab'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('master','master card','mastercard')          THEN 'mastercard'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('visa','visa card')                           THEN 'visa'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('gcash','e-wallet','ewallet')                 THEN 'gcash'
                        WHEN charge_type IS NOT NULL AND charge_type != ''                                                                                THEN LOWER(TRIM(charge_type))
                        WHEN LOWER(TRIM(payment_method)) IN ('panda','foodpanda','food_panda','food panda') THEN 'food panda'
                        WHEN LOWER(TRIM(payment_method)) IN ('grab','grabfood','grab food')                THEN 'grab'
                        WHEN LOWER(TRIM(payment_method)) IN ('master','master card','mastercard')          THEN 'mastercard'
                        WHEN LOWER(TRIM(payment_method)) IN ('visa','visa card')                           THEN 'visa'
                        WHEN LOWER(TRIM(payment_method)) IN ('gcash','e-wallet','ewallet')                 THEN 'gcash'
                        ELSE LOWER(TRIM(payment_method))
                    END as method,
                    total_amount
                FROM sales
                WHERE created_at BETWEEN ? AND ?
                AND status = 'completed'
                {$branchCondition}
            ) as t
            GROUP BY method
        ", [$from, $to]));
    }
}