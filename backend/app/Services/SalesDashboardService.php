<?php

namespace App\Services;

use App\Repositories\SaleRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use App\Models\ZReading;
use App\Models\Branch;

class SalesDashboardService
{
    protected $saleRepo;

    public function __construct(SaleRepositoryInterface $saleRepo)
    {
        $this->saleRepo = $saleRepo;
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    public function getAnalyticsData(?int $branchId = null): array
    {
        $today = Carbon::today();
        return [
            'weekly'           => $this->getWeeklyChartData($branchId),
            'monthly'          => $this->getMonthlyChartData($branchId),
            'quarterly'        => $this->getQuarterlyChartData($branchId),
            'stats'            => $this->getDailyStats($branchId, $today),
            'top_seller_today' => $this->saleRepo->getTopSellers($today, $today->copy()->endOfDay(), 1, $branchId),
            'generated_at'     => now()->toDateTimeString(),
        ];
    }

    public function getDashboardData(?int $branchId = null): array
    {
        $today        = Carbon::today();
        $dailyStart   = $today->copy()->startOfDay();
        $dailyEnd     = $today->copy()->endOfDay();
        $weeklyStart  = Carbon::now()->subDays(6)->startOfDay();
        $weeklyEnd    = Carbon::now()->endOfDay();
        $monthlyStart = Carbon::now()->subDays(29)->startOfDay();

        // 1. Assemble Period Blocks for BM_Dashboard
        // assemblePeriodData uses raw dates (YYYY-MM-DD) which Recharts needs.
        $daily   = $this->assemblePeriodData($dailyStart, $dailyEnd, 'daily', $branchId);
        $weekly  = $this->assemblePeriodData($weeklyStart, $weeklyEnd, 'daily', $branchId);
        $monthly = $this->assemblePeriodData($monthlyStart, $weeklyEnd, 'daily', $branchId);

        // 2. Re-format Weekly for SalesDashboard.tsx (keeping 'date' as raw for compatibility)
        $weeklySalesData = $weekly['data']->map(fn($row) => [
            'day'       => $row['day'],
            'date'      => $row['date'], // Keep as YYYY-MM-DD
            'value'     => $row['value'],
            'full_date' => Carbon::parse($row['date'])->toFormattedDateString(),
        ]);

        // 3. Re-format Today Hourly for SalesDashboard.tsx
        $todayHourly = $this->saleRepo->getHourlySalesBreakdown($dailyStart, $dailyEnd, $branchId)
            ->map(fn($item) => [
                'time'  => Carbon::createFromTime($item->hour)->format('g A'),
                'value' => (float) $item->total,
            ]);

        // 4. Statistics (Matching X-Reading logic)
        $voidToday          = $this->saleRepo->getVoidSalesBetween($dailyStart, $dailyEnd, $branchId);
        $grossOrdered       = $this->saleRepo->getGrossItemSalesBetween($dailyStart, $dailyEnd, $branchId);
        $grossSalesToday    = round($grossOrdered + $voidToday, 2);
        
        $previousAccumulated = $this->saleRepo->getSalesAccumulatedUpTo($dailyStart, $branchId);
        $presentAccumulated  = round($previousAccumulated + $grossSalesToday, 2);
        
        $stats = [
            'beginning_sales'  => (float) $previousAccumulated,
            'today_sales'      => (float) $grossSalesToday,
            'ending_sales'     => (float) $presentAccumulated,
            'cancelled_sales'  => (float) $voidToday,
            'beginning_or'     => $this->saleRepo->getFirstSiNumberBetween($dailyStart, $dailyEnd, $branchId),
            'ending_or'        => $this->saleRepo->getLastSiNumberBetween($dailyStart, $dailyEnd, $branchId),
            'top_seller_today' => $daily['top_sellers'],
        ];

        return [
            // Original fields (for SalesDashboard.tsx)
            'weekly_sales' => array_merge($weekly, [
                'data'               => $weeklySalesData->values()->all(),
                'total_revenue'      => (float) $weekly['stats']['total_sales'],
                'start_date'         => $weeklyStart->toDateString(),
                'end_date'           => $weeklyEnd->toDateString(),
                'current_week_start' => $weeklyStart->toDateString(),
            ]),
            'today_sales'  => [
                'data' => $todayHourly->values()->all(),
                'date' => $today->toDateString(),
            ],
            
            // New fields (for BM_Dashboard)
            'daily_sales'   => $daily,
            'monthly_sales' => $monthly,
            
            // Shared/Unified fields
            'statistics'    => $stats,
            'generated_at'  => now()->toDateTimeString(),
        ];
    }

    private function assemblePeriodData(Carbon $start, Carbon $end, string $chartType, ?int $branchId): array
    {
        return [
            'data'        => $this->saleRepo->getSalesChartData($start, $end, $chartType, $branchId)->map(fn($row) => [
                'date'  => $row->date,
                'day'   => $row->day ?? Carbon::parse($row->date)->format('D'),
                'value' => (float) $row->value,
            ]),
            'stats'       => $this->getPeriodStats($start, $end, $branchId),
            'top_sellers' => $this->saleRepo->getTopSellers($start, $end, 5, $branchId),
        ];
    }

    private function getPeriodStats(Carbon $start, Carbon $end, ?int $branchId): array
    {
        return [
            'total_sales'  => (float) $this->saleRepo->getSalesSumBetween($start, $end, $branchId),
            'total_orders' => (int)   $this->saleRepo->getSalesCountBetween($start, $end, $branchId),
            'voided_sales' => (float) $this->saleRepo->getVoidSalesBetween($start, $end, $branchId),
            'cash_in'      => (float) $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_in'], $branchId),
            'cash_out'     => (float) $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_out', 'cash_drop'], $branchId),
        ];
    }

    private function getWeeklyChartData(?int $branchId): Collection
    {
        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();
        return $this->saleRepo->getSalesChartData($startOfWeek, Carbon::now(), 'daily', $branchId)
            ->map(fn($row) => ['date' => $row->date, 'day' => $row->day, 'value' => (float) $row->value]);
    }

    private function getMonthlyChartData(?int $branchId): Collection
    {
        $start30 = Carbon::now()->subDays(29)->startOfDay();
        return $this->saleRepo->getSalesChartData($start30, Carbon::now(), 'monthly', $branchId)
            ->map(fn($row) => ['date' => $row->date, 'day' => Carbon::parse($row->date)->format('M d'), 'value' => (float) $row->value]);
    }

    private function getQuarterlyChartData(?int $branchId): Collection
    {
        $start3m = Carbon::now()->subMonths(3)->startOfDay();
        return $this->saleRepo->getSalesChartData($start3m, Carbon::now(), 'weekly', $branchId)
            ->map(fn($row) => ['date' => $row->week_start, 'day' => 'Wk ' . Carbon::parse($row->week_start)->format('M d'), 'value' => (float) $row->value]);
    }

    private function getDailyStats(?int $branchId, Carbon $today): array
    {
        $yesterday    = Carbon::yesterday();
        $todayEnd     = $today->copy()->endOfDay();
        $yesterdayEnd = $yesterday->copy()->endOfDay();

        $salesYesterday = $this->saleRepo->getSalesSumBetween($yesterday, $yesterdayEnd, $branchId);
        $salesToday     = $this->saleRepo->getSalesSumBetween($today, $todayEnd, $branchId);
        $ordersToday    = $this->saleRepo->getSalesCountBetween($today, $todayEnd, $branchId);

        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();
        $last7Dates  = collect(range(6, 0))->map(fn($d) => Carbon::now()->subDays($d)->toDateString());
        $dailyData   = $this->saleRepo->getSalesChartData($startOfWeek, Carbon::now(), 'monthly', $branchId)->pluck('value', 'date');
        $sparkSales  = $last7Dates->map(fn($d) => (float) ($dailyData[$d] ?? 0))->values()->all();

        return [
            'sales_today'     => $salesToday,
            'orders_today'    => $ordersToday,
            'sales_yesterday' => $salesYesterday,
            'growth_rate'     => $salesYesterday > 0
                ? round((($salesToday - $salesYesterday) / $salesYesterday) * 100, 2)
                : 0,
            'spark_sales'     => $sparkSales,
        ];
    }

    // ─── Items report ─────────────────────────────────────────────────────────

    public function getItemReport(string $fromDate, string $toDate, string $reportType = 'item-list', ?int $branchId = null): array
    {
        $from  = Carbon::parse($fromDate)->startOfDay();
        $to    = Carbon::parse($toDate)->endOfDay();
        $items = $reportType === 'category-summary'
            ? $this->saleRepo->getCategoryItemSummary($from, $to, $branchId)
            : $this->saleRepo->getItemsSoldBetween($from, $to, $branchId);

        return [
            'items'       => $items,
            'total_qty'   => $items->sum('qty'),
            'grand_total' => (float) $items->sum('amount'),
        ];
    }

    // ─── Shared: BIR-compliant gross/net computation ──────────────────────────
    //
    // Golden rule enforced in ProcessCheckoutAction::recalculateVat():
    //   vatable_sales + vat_amount + vat_exempt_sales ≡ total_amount
    //
    // Therefore:
    //   totalCollected = SUM(total_amount) = SUM(VAT components) = netSales
    //   grossSales     = totalCollected + totalDiscounts + voidAmount
    //   roundingAdj    = 0 (by construction)
    //
    // This eliminates the need for an independent \"reconstructGross\" formula
    // that could diverge from what was actually collected.
    // ─────────────────────────────────────────────────────────────────────────────

    // ─── X-Reading ─────────────────────────────────────────────────────────────

    public function getXReading(string $date, ?string $toDate = null, ?int $branchId = null, ?int $shift = null): array
    {
        $from = Carbon::parse($date)->startOfDay();
        $to   = $toDate ? Carbon::parse($toDate)->endOfDay() : Carbon::parse($date)->endOfDay();

        $isVat = true;
        if ($branchId) {
            $branch = Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }

        $voidAmount       = $this->saleRepo->getVoidSalesBetween($from, $to, $branchId, $shift);
        $transactionCount = $this->saleRepo->getSalesCountBetween($from, $to, $branchId, $shift);
        $cashSales        = $this->saleRepo->getNetCashPayments($from, $to, $branchId, $shift);
        $voidCount        = $this->saleRepo->getVoidCountBetween($from, $to, $branchId, $shift);
        $begSI            = $this->saleRepo->getFirstSiNumberBetween($from, $to, $branchId, $shift);
        $endSI            = $this->saleRepo->getLastSiNumberBetween($from, $to, $branchId, $shift);
        $grossOrdered     = $this->saleRepo->getGrossItemSalesBetween($from, $to, $branchId, $shift);
        $discounts        = $this->saleRepo->getDiscountsBreakdown($from, $to, $branchId, $shift);

        $totalDiscounts = round(
            $discounts['sc_discount'] + $discounts['pwd_discount'] +
            $discounts['diplomat_discount'] + $discounts['other_discount'],
            2
        );

        $scPwdTotal = $discounts['sc_discount'] + $discounts['pwd_discount'];
        $lessVat    = $scPwdTotal > 0 ? round(($scPwdTotal / 0.20) * 0.12, 2) : 0;

        $paymentBreakdown = $this->saleRepo->getPaymentMethodBreakdown($from, $to, $branchId, $shift);
        $totalCollected   = (float) $paymentBreakdown->sum('amount');

        if ($isVat) {
            $taxAndVat      = $this->saleRepo->getTaxAndVatAggregates($from, $to, $branchId, $shift);
            $vatableSales   = (float) $taxAndVat->vatable_sales;
            $vatAmount      = (float) $taxAndVat->vat_amount;
            $vatExemptSales = (float) $taxAndVat->vat_exempt_sales;
        } else {
            $vatableSales   = 0.0;
            $vatAmount      = 0.0;
            $vatExemptSales = 0.0;
        }

        // totalCollected IS netSales (voids already excluded by status='completed')
        $netSales   = $totalCollected;
        
        // Present Gross matches Z-reading logic
        $grossSales = round($grossOrdered + $voidAmount, 2);
        $netTotal   = round($vatableSales + $vatExemptSales, 2);

        // Accumulated counts/sums (matching Z-reading signature)
        $isSingleDay         = true;
        $previousAccumulated = $this->saleRepo->getSalesAccumulatedUpTo($from, $branchId);
        $presentAccumulated  = round($previousAccumulated + $grossSales, 2);
        $zCounter            = $this->saleRepo->getZReadingsCountUpTo($from, $branchId, $isSingleDay);

        // Rounding adjustment should be 0 by construction (golden rule)
        $roundingAdjustment = round($totalCollected - $netSales, 2);
        $actualNonCash      = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount');

        $hourly = $this->saleRepo->getHourlySalesBreakdown($from, $to, $branchId, $shift)->map(fn($item) => [
            'time'  => Carbon::createFromTime($item->hour)->format('g A'),
            'total' => (float) $item->total,
            'count' => $item->count,
        ]);

        $totalQtySold = $this->saleRepo->getTotalQtySoldBetween($from, $to, $branchId, $shift);
        $cashIn       = $this->saleRepo->getCashTransactionsSum($from, $to, ['cash_in'], $branchId, $shift);
        $cashDrop     = $this->saleRepo->getCashTransactionsSum($from, $to, ['cash_out', 'cash_drop'], $branchId, $shift);
        $cupBreakdown = $this->saleRepo->getCupSizeBreakdown($from, $to, $branchId, $shift);

        return array_merge([
            'date'                => $from->toDateString(),
            'to_date'             => $to->toDateString(),
            'gross_sales'         => $grossSales,
            'net_sales'           => $netSales,
            'net_total'           => $netTotal,
            'transaction_count'   => $transactionCount,
            'cash_total'          => $cashSales,
            'non_cash_total'      => $actualNonCash,
            'total_payments'      => $totalCollected,
            'hourly_data'         => $hourly,
            'beg_si'              => $begSI,
            'end_si'              => $endSI,
            'void_count'          => $voidCount,
            'total_void_amount'   => $voidAmount,
            'vatable_sales'       => $vatableSales,
            'vat_amount'          => $vatAmount,
            'vat_exempt_sales'    => $vatExemptSales,
            'is_vat'              => $isVat,
            'sc_discount'         => $discounts['sc_discount'],
            'pwd_discount'        => $discounts['pwd_discount'],
            'diplomat_discount'   => $discounts['diplomat_discount'],
            'other_discount'      => $discounts['other_discount'],
            'total_discounts'     => $totalDiscounts,
            'payment_breakdown'   => $paymentBreakdown,
            'total_qty_sold'      => $totalQtySold,
            'cash_in'             => $cashIn,
            'cash_in_drawer'      => $cashIn + $cashSales - $cashDrop,
            'cash_drop'           => $cashDrop,
            'rounding_adjustment' => $roundingAdjustment,
            'less_vat'            => $lessVat,
            'z_counter'           => $zCounter,
            'previous_accumulated' => $previousAccumulated,
            'present_accumulated'  => $presentAccumulated,
            'reset_counter'       => 0,
        ], $cupBreakdown);
    }

    // ─── Z-Reading ─────────────────────────────────────────────────────────────

    public function generateZReading(string $fromStr, string $toStr, ?int $branchId = null, ?int $shift = null): array
    {
        $start = Carbon::parse($fromStr)->startOfDay();
        $end   = Carbon::parse($toStr)->endOfDay();

        $isVat = true;
        if ($branchId) {
            $branch = Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }

        $voidAmount       = $this->saleRepo->getVoidSalesBetween($start, $end, $branchId, $shift);
        $cash             = $this->saleRepo->getNetCashPayments($start, $end, $branchId, $shift);
        $discounts        = $this->saleRepo->getDiscountsBreakdown($start, $end, $branchId, $shift);
        $paymentBreakdown = $this->saleRepo->getPaymentMethodBreakdown($start, $end, $branchId, $shift);
        $grossOrdered     = $this->saleRepo->getGrossItemSalesBetween($start, $end, $branchId, $shift);

        $totalDiscounts = round(
            $discounts['sc_discount'] + $discounts['pwd_discount'] +
            $discounts['diplomat_discount'] + $discounts['other_discount'],
            2
        );

        $scPwdTotal = $discounts['sc_discount'] + $discounts['pwd_discount'];
        $lessVat    = $scPwdTotal > 0 ? round(($scPwdTotal / 0.20) * 0.12, 2) : 0;

        // totalCollected = SUM(total_amount) = what customers actually paid
        $totalCollected = (float) $paymentBreakdown->sum('amount');

        if ($isVat) {
            $taxAndVat      = $this->saleRepo->getTaxAndVatAggregates($start, $end, $branchId, $shift);
            $vatableSales   = (float) $taxAndVat->vatable_sales;
            $vatAmount      = (float) $taxAndVat->vat_amount;
            $vatExemptSales = (float) $taxAndVat->vat_exempt_sales;
        } else {
            $vatableSales   = 0.0;
            $vatAmount      = 0.0;
            $vatExemptSales = 0.0;
        }

        // totalCollected IS netSales (voids already excluded by status filter)
        $netSales = $totalCollected;
        // Gross is based on ordered items before discounts/VAT allocation split.
        $gross    = round($grossOrdered + $voidAmount, 2);
        $netTotal = round($vatableSales + $vatExemptSales, 2);

        // Rounding adjustment = 0 by construction (golden rule)
        $roundingAdjustment = round($totalCollected - $netSales, 2);

        $begSI        = $this->saleRepo->getFirstSiNumberBetween($start, $end, $branchId, $shift);
        $endSI        = $this->saleRepo->getLastSiNumberBetween($start, $end, $branchId, $shift);
        $totalQtySold = $this->saleRepo->getTotalQtySoldBetween($start, $end, $branchId, $shift);
        $cashIn       = $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_in'], $branchId, $shift);
        $cashDrop     = $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_out', 'cash_drop'], $branchId, $shift);

        $isSingleDay         = ($fromStr === $toStr);
        $zCounter            = $this->saleRepo->getZReadingsCountUpTo($start, $branchId, $isSingleDay);
        $previousAccumulated = $this->saleRepo->getSalesAccumulatedUpTo($start, $branchId);
        $presentAccumulated  = round($previousAccumulated + $gross, 2);
        $actualNonCash       = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount');
        $cupBreakdown        = $this->saleRepo->getCupSizeBreakdown($start, $end, $branchId, $shift);

        $reportData = array_merge([
            'from_date'            => $start->toDateString(),
            'to_date'              => $end->toDateString(),
            'branch_id'            => $branchId,
            'gross_sales'          => $gross,
            'net_sales'            => $netSales,
            'net_total'            => $netTotal,
            'total_discounts'      => $totalDiscounts,
            'total_void_amount'    => $voidAmount,
            'transaction_count'    => $this->saleRepo->getSalesCountBetween($start, $end, $branchId, $shift),
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
            'non_cash_total'       => (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount'),
            'total_payments'       => $totalCollected,
            'payment_breakdown'    => $paymentBreakdown,
            'beg_si'               => $this->saleRepo->getFirstSiNumberBetween($start, $end, $branchId),
            'end_si'               => $this->saleRepo->getLastSiNumberBetween($start, $end, $branchId),
            'cash_in'              => $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_in'], $branchId, $shift),
            'cash_drop'            => $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_out', 'cash_drop'], $branchId, $shift),
            'cash_in_drawer'       => round($this->saleRepo->getCashTransactionsSum($start, $end, ['cash_in'], $branchId, $shift) + $cash - $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_out', 'cash_drop'], $branchId, $shift), 2),
            'expected_amount'      => round($this->saleRepo->getCashTransactionsSum($start, $end, ['cash_in'], $branchId, $shift) + $cash - $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_out', 'cash_drop'], $branchId, $shift), 2),
            'z_counter'            => $this->saleRepo->getZReadingsCountUpTo($start, $branchId, ($fromStr === $toStr)),
            'reset_counter'        => 0,
            'previous_accumulated' => $previousAccumulated,
            'present_accumulated'  => $presentAccumulated,
            'sales_for_the_day'    => $netSales,
            'less_vat'             => $lessVat,
            'rounding_adjustment'  => $roundingAdjustment,
            'category_breakdown'   => [],
            'generated_at'         => now()->toDateTimeString(),
        ], $cupBreakdown);

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

    public function getMallReport(string $date, string $mallName, ?int $branchId = null): array
    {
        $from    = Carbon::parse($date)->startOfDay();
        $to      = Carbon::parse($date)->endOfDay();
        $gross   = $this->saleRepo->getSalesSumBetween($from, $to, $branchId);
        $netSales = round($gross / 1.12, 2);

        return [
            'mall'              => $mallName,
            'date'              => $from->toDateString(),
            'branch_id'         => $branchId,
            'gross_sales'       => $gross,
            'net_sales'         => $netSales,
            'tax_amount'        => round($gross - $netSales, 2),
            'transaction_count' => $this->saleRepo->getSalesCountBetween($from, $to, $branchId),
            'tenant_id'         => 'LUCKYBOBA-001',
            'generated_at'      => now()->toDateTimeString(),
        ];
    }

    public function getZReadingHistory(?int $branchId = null, int $limit = 50): Collection
    {
        return $this->saleRepo->getZReadingsHistory($branchId, $limit);
    }

    public function checkZReadingStatus(string $date, ?int $branchId = null): array
    {
        $day      = Carbon::parse($date)->toDateString();
        $zReading = ZReading::where('reading_date', $day)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->first();

        $start    = Carbon::parse($day)->startOfDay();
        $end      = Carbon::parse($day)->endOfDay();
        $hasSales = $this->saleRepo->getSalesCountBetween($start, $end, $branchId) > 0;

        return [
            'exists'    => (bool) $zReading,
            'is_closed' => (bool) ($zReading?->is_closed ?? false),
            'closed_at' => $zReading?->closed_at,
            'has_sales' => $hasSales,
            'date'      => $day,
        ];
    }

    public function getZReadingGaps(?int $branchId = null, int $days = 30): array
    {
        $gaps  = [];
        $today = Carbon::today();

        for ($i = 1; $i <= $days; $i++) {
            $date    = $today->copy()->subDays($i);
            $dateStr = $date->toDateString();

            $exists = ZReading::where('reading_date', $dateStr)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->exists();

            if (!$exists) {
                $hasSales = $this->saleRepo->getSalesCountBetween(
                    $date->copy()->startOfDay(),
                    $date->copy()->endOfDay(),
                    $branchId
                ) > 0;

                if ($hasSales) {
                    $gaps[] = $dateStr;
                }
            }
        }

        return $gaps;
    }
}