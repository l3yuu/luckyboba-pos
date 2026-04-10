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
        $today = Carbon::today();
        
        return [
            'weekly'            => $this->getWeeklyChartData($branchId),
            'monthly'           => $this->getMonthlyChartData($branchId),
            'quarterly'         => $this->getQuarterlyChartData($branchId),
            'stats'             => $this->getDailyStats($branchId, $today),
            'top_seller_today'  => $this->getTopSeller($branchId, $today),
            'generated_at'      => now()->toDateTimeString(),
        ];
    }
        
    private function getWeeklyChartData(?int $branchId): \Illuminate\Support\Collection
    {
        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();
        return Sale::where('created_at', '>=', $startOfWeek)
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
    }

    private function getMonthlyChartData(?int $branchId): \Illuminate\Support\Collection
    {
        $start30 = Carbon::now()->subDays(29)->startOfDay();
        return Sale::where('created_at', '>=', $start30)
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
    }

    private function getQuarterlyChartData(?int $branchId): \Illuminate\Support\Collection
    {
        $start3m = Carbon::now()->subMonths(3)->startOfDay();
        return Sale::where('created_at', '>=', $start3m)
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
    }

    private function getDailyStats(?int $branchId, $today): array
    {
        $yesterday = Carbon::yesterday();
        
        $salesYesterday = (float) DB::table('sales')
            ->whereDate('created_at', $yesterday)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('SUM(total_amount) as total'))
            ->value('total');

        $salesToday = (float) DB::table('sales')
            ->whereDate('created_at', $today)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('SUM(total_amount) as total'))
            ->value('total');

        $ordersToday = (int) DB::table('sales')
            ->whereDate('created_at', $today)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();

        // ── Sparkline stats ──────────────────────────────────────────────────
        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();
        $last7Dates = collect(range(6, 0))->map(fn($d) => Carbon::now()->subDays($d)->toDateString());
        
        $dailyData = Sale::where('created_at', '>=', $startOfWeek)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as net_total')
            )
            ->groupBy('date')
            ->pluck('net_total', 'date');

        $sparkSales = $last7Dates->map(fn($d) => (float) ($dailyData[$d] ?? 0))->values()->all();

        return [
            'sales_today'      => $salesToday,
            'orders_today'     => $ordersToday,
            'sales_yesterday'  => $salesYesterday,
            'growth_rate'      => $salesYesterday > 0 ? round((($salesToday - $salesYesterday) / $salesYesterday) * 100, 2) : 0,
            'spark_sales'      => $sparkSales,
        ];
    }

    private function getTopSeller(?int $branchId, $today)
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $today)
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
            ->groupBy('sale_items.product_name')
            ->orderBy('total_qty', 'DESC')
            ->first();
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

        // ── Discounts ─────────────────────────────────────────────────────────
        $discounts = $this->computeDiscounts($from, $to, $branchId);

        $scPwdDiscount  = $discounts['sc_discount'] + $discounts['pwd_discount'];
        $otherDiscounts = $discounts['diplomat_discount'] + $discounts['other_discount'];
        $totalDiscounts = round($scPwdDiscount + $otherDiscounts, 2);

        // ── VAT Calculation ───────────────────────────────────────────────────
        if ($isVat) {
            $vatableSales   = (float) $sales->sum('vatable_sales');
            $vatAmount      = (float) $sales->sum('vat_amount');
            $vatExemptSales = round($scPwdDiscount / 1.12, 2);
            $netSales       = round($vatableSales + $vatExemptSales, 2);
            $grossSales = round($netSales + $vatAmount + $totalDiscounts, 2);
        } else {
            $vatableSales   = 0.0;
            $vatAmount      = 0.0;
            $vatExemptSales = 0.0;
            $netSales       = round($grossSales - $totalDiscounts, 2);
        }
        // ─────────────────────────────────────────────────────────────────────

        $paymentBreakdown = $this->computePaymentBreakdown($from, $to, $branchId);
        $totalCollected   = (float) $paymentBreakdown->sum('amount');
        $actualNonCash    = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount');

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
            'net_sales'         => $netSales,
            'transaction_count' => $transactionCount,
            'cash_total'        => $cashSales,
            'non_cash_total'    => $actualNonCash,
            'total_payments'    => $totalCollected,
            'hourly_data'       => $hourly,
            'beg_si'            => $begSI,
            'end_si'            => $endSI,
            'void_count'        => $voidCount,
            'total_void_amount' => $voidAmount,
            'vatable_sales'     => $vatableSales,
            'vat_amount'        => $vatAmount,
            'vat_exempt_sales'  => $vatExemptSales,
            'is_vat'            => $isVat,
            'sc_discount'       => $discounts['sc_discount'],
            'pwd_discount'      => $discounts['pwd_discount'],
            'diplomat_discount' => $discounts['diplomat_discount'],
            'other_discount'    => $discounts['other_discount'],
            'total_discounts'   => $totalDiscounts,
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
            ->select(DB::raw('SUM(total_amount) as net_cash'))
            ->value('net_cash');

        $voidAmount = (float) DB::table('sales')
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        $discounts        = $this->computeDiscounts($start, $end, $branchId);
        $paymentBreakdown = $this->computePaymentBreakdown($start, $end, $branchId);

        // ── Discounts ─────────────────────────────────────────────────────────
        $scPwdDiscount  = $discounts['sc_discount'] + $discounts['pwd_discount'];
        $otherDiscounts = $discounts['diplomat_discount'] + $discounts['other_discount'];
        $totalDiscounts = round($scPwdDiscount + $otherDiscounts, 2);

        // ── VAT Calculation ───────────────────────────────────────────────────
        if ($isVat) {
            $vatableSales   = (float) $sales->sum('vatable_sales');
            $vatAmount      = (float) $sales->sum('vat_amount');
            $vatExemptSales = (float) $sales->sum('vat_exempt_sales');
            
            // Total Gross before any discounts or voids
            $gross = round($vatableSales + $vatExemptSales + $vatAmount, 2);
            
            // Net Sales is the taxable base after discounts and voids
            $netSales = round($vatableSales + $vatExemptSales - $voidAmount - $totalDiscounts, 2);
        } else {
            $vatableSales   = 0.0;
            $vatAmount      = 0.0;
            $vatExemptSales = 0.0;
            // For non-vat, subtract total discounts and void amount from raw gross to get net sales
            $netSales       = round($gross - $totalDiscounts - $voidAmount, 2);
        }
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

        // ── Z Counter & Accumulated Sales ─────────────────────────────────────
        $isSingleDay = ($from === $to);
        if ($isSingleDay) {
            $previousAccumulated = (float) ZReading::where('reading_date', '<', $start->toDateString())
    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
    ->sum('total_sales');

$zCounter = (int) ZReading::where('reading_date', '<=', $start->toDateString())
    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
    ->count() + 1;

            $resetCounter = 0;
        } else {
            $previousAccumulated = (float) ZReading::where('reading_date', '<', $start->toDateString())
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_sales');
            
            // For range mode, count existing ZReading records in the range
            $zCounter = (int) ZReading::whereBetween('reading_date', [
                $start->toDateString(),
                $end->toDateString(),
            ])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();
            
            $resetCounter = 0;
        }

        $totalCollected = (float) $paymentBreakdown->sum('amount');
        $salesForTheDay     = $totalCollected;
        $presentAccumulated = round($previousAccumulated + $salesForTheDay, 2);
        $actualNonCash  = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount');

        $reportData = [
            'from_date'            => $start->toDateString(),
            'to_date'              => $end->toDateString(),
            'branch_id'            => $branchId,
            'gross_sales'          => $gross,
            'net_sales'            => $netSales,
            'total_discounts'      => $totalDiscounts,
            'total_void_amount'    => $voidAmount,
            'transaction_count'    => $sales->count(),
            'total_qty_sold'       => $totalQtySold,
            'vatable_sales'        => $vatableSales,
            'vat_amount'           => $vatAmount,
            'vat_exempt_sales'     => $vatExemptSales,
            'is_vat'               => $isVat,
            'sc_discount'          => $discounts['sc_discount'],
            'pwd_discount'         => $discounts['pwd_discount'],
            'diplomat_discount'    => $discounts['diplomat_discount'],
            'other_discount'       => $discounts['other_discount'],
            'cash_total'           => $cash,
            'non_cash_total'       => $actualNonCash,
            'total_payments'       => $totalCollected,
            'payment_breakdown'    => $paymentBreakdown,
            'beg_si'               => $begSI,
            'end_si'               => $endSI,
            'cash_in'              => $cashIn,
            'cash_drop'            => $cashDrop,
            'cash_in_drawer'       => round($cashIn + $cash - $cashDrop, 2),
            'z_counter'            => $zCounter,
            'reset_counter'        => $resetCounter,
            'previous_accumulated' => $previousAccumulated,
            'present_accumulated'  => $presentAccumulated,
            'sales_for_the_day'    => $salesForTheDay,
            'category_breakdown'   => $categoryBreakdown,
            'generated_at'         => now()->toDateTimeString(),
        ];

        if ($isSingleDay) {
    ZReading::updateOrCreate(
        ['reading_date' => $start->toDateString(), 'branch_id' => $branchId],
        [
            'total_sales' => $gross,
            'net_sales'   => $netSales,
            'data'        => json_encode($reportData),
        ]
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

        $paxTotals = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->selectRaw('SUM(pax_senior) as total_senior_pax, SUM(pax_pwd) as total_pwd_pax')
            ->first();

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
                'total'     => $discounts['sc_discount'],
                'pax_count' => (int) ($paxTotals->total_senior_pax ?? 0),
            ],
            'pwd_discount' => [
                'total'     => $discounts['pwd_discount'],
                'pax_count' => (int) ($paxTotals->total_pwd_pax ?? 0),
            ],
            'diplomat_discount' => [
                'total' => $discounts['diplomat_discount'],
            ],
            'other_discount' => [
                'total'                 => $discounts['other_discount'],
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
    private function computeDiscounts(Carbon $from, Carbon $to, ?int $branchId): array
    {
        // ── Item-level discounts ──────────────────────────────────────────────
        $base = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$from, $to])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId));

        $scItem = round((float) (clone $base)
            ->where('sale_items.discount_label', 'LIKE', '%SENIOR%')
            ->sum('sale_items.discount_amount'), 2);

        $pwdItem = round((float) (clone $base)
            ->where('sale_items.discount_label', 'LIKE', '%PWD%')
            ->sum('sale_items.discount_amount'), 2);

        $diplomatItem = (float) (clone $base)
            ->where('sale_items.discount_label', 'LIKE', '%DIPLOMAT%')
            ->sum('sale_items.discount_amount');

        $itemLevelOther = (float) (clone $base)
            ->where('sale_items.discount_label', 'NOT LIKE', '%SENIOR%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%PWD%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%DIPLOMAT%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%FREE%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%FREE ITEM%')
            ->whereNotNull('sale_items.discount_label')
            ->where('sale_items.discount_label', '!=', '')
            ->sum('sale_items.discount_amount');

        // ── Order-level discounts ─────────────────────────────────────────────
        $orderBase = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $scOrder       = round((float) (clone $orderBase)->sum('sc_discount_amount'), 2);
        $pwdOrder      = round((float) (clone $orderBase)->sum('pwd_discount_amount'), 2);
        $diplomatOrder = (float) (clone $orderBase)->sum('diplomat_discount_amount');
        $otherOrder    = (float) (clone $orderBase)->sum('other_discount_amount');

        return [
            'sc_discount'       => round($scItem        + $scOrder,       2),
            'pwd_discount'      => round($pwdItem        + $pwdOrder,      2),
            'diplomat_discount' => round($diplomatItem   + $diplomatOrder, 2),
            'other_discount'    => round($itemLevelOther + $otherOrder,    2),
        ];
    }

    /**
     * Shared payment breakdown used by getXReading and generateZReading.
     */
    private function computePaymentBreakdown(Carbon $from, Carbon $to, ?int $branchId): \Illuminate\Support\Collection
{
    $bindings        = [$from, $to];
    $branchCondition = '';
    if ($branchId) {
        $branchCondition = 'AND branch_id = ?';
        $bindings[]      = $branchId;
    }

    return collect(DB::select("
        SELECT method, SUM(net_amount) as amount
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
                total_amount as net_amount
            FROM sales
            WHERE created_at BETWEEN ? AND ?
            AND status = 'completed'
            {$branchCondition}
        ) as t
        GROUP BY method
    ", $bindings));
}
}