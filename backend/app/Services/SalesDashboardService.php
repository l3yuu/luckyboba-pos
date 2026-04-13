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

    // ─── Analytics (BranchManagerDashboard) ───────────────────────────────────

    public function getAnalyticsData(?int $branchId = null): array
    {
        $today = Carbon::today();
        
        return [
            'weekly'            => $this->getWeeklyChartData($branchId),
            'monthly'           => $this->getMonthlyChartData($branchId),
            'quarterly'         => $this->getQuarterlyChartData($branchId),
            'stats'             => $this->getDailyStats($branchId, $today),
            'top_seller_today'  => $this->saleRepo->getTopSellers($today, $today->copy()->endOfDay(), 1, $branchId),
            'generated_at'      => now()->toDateTimeString(),
        ];
    }

    /**
     * Comprehensive data for BM_Dashboard.tsx
     */
    public function getDashboardData(?int $branchId = null): array
    {
        $today = Carbon::today();
        
        // Define periods
        $dailyStart   = $today->copy()->startOfDay();
        $dailyEnd     = $today->copy()->endOfDay();
        
        $weeklyStart  = Carbon::now()->subDays(6)->startOfDay();
        $weeklyEnd    = Carbon::now()->endOfDay();
        
        $monthlyStart = Carbon::now()->subDays(29)->startOfDay();
        $monthlyEnd   = Carbon::now()->endOfDay();

        return [
            'daily_sales'   => $this->assemblePeriodData($dailyStart, $dailyEnd, 'daily', $branchId),
            'weekly_sales'  => $this->assemblePeriodData($weeklyStart, $weeklyEnd, 'daily', $branchId),
            'monthly_sales' => $this->assemblePeriodData($monthlyStart, $monthlyEnd, 'monthly', $branchId),
            'statistics'    => [
                'top_seller_today' => $this->saleRepo->getTopSellers($dailyStart, $dailyEnd, 5, $branchId)
            ],
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
            ->map(fn($row) => [
                'date'  => $row->date,
                'day'   => $row->day,
                'value' => (float) $row->value,
            ]);
    }

    private function getMonthlyChartData(?int $branchId): Collection
    {
        $start30 = Carbon::now()->subDays(29)->startOfDay();
        return $this->saleRepo->getSalesChartData($start30, Carbon::now(), 'monthly', $branchId)
            ->map(fn($row) => [
                'date'  => $row->date,
                'day'   => Carbon::parse($row->date)->format('M d'),
                'value' => (float) $row->value,
            ]);
    }

    private function getQuarterlyChartData(?int $branchId): Collection
    {
        $start3m = Carbon::now()->subMonths(3)->startOfDay();
        return $this->saleRepo->getSalesChartData($start3m, Carbon::now(), 'weekly', $branchId)
            ->map(fn($row) => [
                'date'  => $row->week_start,
                'day'   => 'Wk ' . Carbon::parse($row->week_start)->format('M d'),
                'value' => (float) $row->value,
            ]);
    }

    private function getDailyStats(?int $branchId, Carbon $today): array
    {
        $yesterday = Carbon::yesterday();
        $todayEnd = $today->copy()->endOfDay();
        $yesterdayEnd = $yesterday->copy()->endOfDay();

        $salesYesterday = $this->saleRepo->getSalesSumBetween($yesterday, $yesterdayEnd, $branchId);
        $salesToday = $this->saleRepo->getSalesSumBetween($today, $todayEnd, $branchId);
        $ordersToday = $this->saleRepo->getSalesCountBetween($today, $todayEnd, $branchId);

        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();
        $last7Dates = collect(range(6, 0))->map(fn($d) => Carbon::now()->subDays($d)->toDateString());
        
        $dailyData = $this->saleRepo->getSalesChartData($startOfWeek, Carbon::now(), 'monthly', $branchId)->pluck('value', 'date');
        $sparkSales = $last7Dates->map(fn($d) => (float) ($dailyData[$d] ?? 0))->values()->all();

        return [
            'sales_today'      => $salesToday,
            'orders_today'     => $ordersToday,
            'sales_yesterday'  => $salesYesterday,
            'growth_rate'      => $salesYesterday > 0 ? round((($salesToday - $salesYesterday) / $salesYesterday) * 100, 2) : 0,
            'spark_sales'      => $sparkSales,
        ];
    }

    // ─── Items report ─────────────────────────────────────────────────────────

    public function getItemReport(string $fromDate, string $toDate, string $reportType = 'item-list', ?int $branchId = null): array
    {
        $from = Carbon::parse($fromDate)->startOfDay();
        $to = Carbon::parse($toDate)->endOfDay();

        if ($reportType === 'category-summary') {
            $items = $this->saleRepo->getCategoryItemSummary($from, $to, $branchId);
        } else {
            $items = $this->saleRepo->getItemsSoldBetween($from, $to, $branchId);
        }

        return [
            'items'       => $items,
            'total_qty'   => $items->sum('qty'),
            'grand_total' => (float) $items->sum('amount'),
        ];
    }

    // ─── X-Reading ──────────────────────────────────────────────────────────────

    public function getXReading(string $date, ?string $toDate = null, ?int $branchId = null): array
    {
        $from = Carbon::parse($date)->startOfDay();
        $to   = $toDate ? Carbon::parse($toDate)->endOfDay() : Carbon::parse($date)->endOfDay();

        $isVat = true;
        if ($branchId) {
            $branch = Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }

        $grossSales = $this->saleRepo->getSalesSumBetween($from, $to, $branchId);
        $transactionCount = $this->saleRepo->getSalesCountBetween($from, $to, $branchId);
        $cashSales = $this->saleRepo->getNetCashPayments($from, $to, $branchId);
        $voidCount = $this->saleRepo->getVoidCountBetween($from, $to, $branchId);
        $voidAmount = $this->saleRepo->getVoidSalesBetween($from, $to, $branchId);
        $begSI = $this->saleRepo->getFirstSiNumberBetween($from, $to, $branchId);
        $endSI = $this->saleRepo->getLastSiNumberBetween($from, $to, $branchId);

        $discounts = $this->saleRepo->getDiscountsBreakdown($from, $to, $branchId);
        $scPwdDiscount  = $discounts['sc_discount'] + $discounts['pwd_discount'];
        $otherDiscounts = $discounts['diplomat_discount'] + $discounts['other_discount'];
        $totalDiscounts = round($scPwdDiscount + $otherDiscounts, 2);

        $taxAndVat = $this->saleRepo->getTaxAndVatAggregates($from, $to, $branchId);
        if ($isVat) {
            $vatableSales   = (float) $taxAndVat->vatable_sales;
            $vatAmount      = (float) $taxAndVat->vat_amount;
            $vatExemptSales = round($scPwdDiscount / 1.12, 2);
            $netSales       = round($vatableSales + $vatExemptSales, 2);
            $grossSales     = round($netSales + $vatAmount + $totalDiscounts, 2);
        } else {
            $vatableSales   = 0.0;
            $vatAmount      = 0.0;
            $vatExemptSales = 0.0;
            $netSales       = round($grossSales - $totalDiscounts, 2);
        }

        $paymentBreakdown = $this->saleRepo->getPaymentMethodBreakdown($from, $to, $branchId);
        $totalCollected = (float) $paymentBreakdown->sum('amount');
        $actualNonCash = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount');

        $hourly = $this->saleRepo->getHourlySalesBreakdown($from, $to, $branchId)->map(fn($item) => [
            'time'  => Carbon::createFromTime($item->hour)->format('g A'),
            'total' => (float) $item->total,
            'count' => $item->count,
        ]);

        $totalQtySold = $this->saleRepo->getTotalQtySoldBetween($from, $to, $branchId);
        $cashIn = $this->saleRepo->getCashTransactionsSum($from, $to, ['cash_in'], $branchId);
        $cashDrop = $this->saleRepo->getCashTransactionsSum($from, $to, ['cash_out', 'cash_drop'], $branchId);

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

    // ─── Z-Reading ─────────────────────────────────────────────────────────────

    public function generateZReading(string $fromStr, string $toStr, ?int $branchId = null): array
    {
        $start = Carbon::parse($fromStr)->startOfDay();
        $end   = Carbon::parse($toStr)->endOfDay();

        $isVat = true;
        if ($branchId) {
            $branch = Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }

        $gross = $this->saleRepo->getSalesSumBetween($start, $end, $branchId);
        $cash = $this->saleRepo->getNetCashPayments($start, $end, $branchId);
        $voidAmount = $this->saleRepo->getVoidSalesBetween($start, $end, $branchId);

        $discounts = $this->saleRepo->getDiscountsBreakdown($start, $end, $branchId);
        $paymentBreakdown = $this->saleRepo->getPaymentMethodBreakdown($start, $end, $branchId);

        $scPwdDiscount = $discounts['sc_discount'] + $discounts['pwd_discount'];
        $otherDiscounts = $discounts['diplomat_discount'] + $discounts['other_discount'];
        $totalDiscounts = round($scPwdDiscount + $otherDiscounts, 2);

        $taxAndVat = $this->saleRepo->getTaxAndVatAggregates($start, $end, $branchId);
        if ($isVat) {
            $vatableSales   = (float) $taxAndVat->vatable_sales;
            $vatAmount      = (float) $taxAndVat->vat_amount;
            $vatExemptSales = (float) $taxAndVat->vat_exempt_sales;
            $gross = round($vatableSales + $vatExemptSales + $vatAmount, 2);
            $netSales = round($vatableSales + $vatExemptSales - $voidAmount - $totalDiscounts, 2);
        } else {
            $vatableSales   = 0.0;
            $vatAmount      = 0.0;
            $vatExemptSales = 0.0;
            $netSales       = round($gross - $totalDiscounts - $voidAmount, 2);
        }

        $begSI = $this->saleRepo->getFirstSiNumberBetween($start, $end, $branchId);
        $endSI = $this->saleRepo->getLastSiNumberBetween($start, $end, $branchId);
        $totalQtySold = $this->saleRepo->getTotalQtySoldBetween($start, $end, $branchId);
        $cashIn = $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_in'], $branchId);
        $cashDrop = $this->saleRepo->getCashTransactionsSum($start, $end, ['cash_out', 'cash_drop'], $branchId);

        $isSingleDay = ($fromStr === $toStr);
        $zCounter = $this->saleRepo->getZReadingsCountUpTo($start, $branchId, $isSingleDay);
        $previousAccumulated = $this->saleRepo->getSalesAccumulatedUpTo($start, $branchId);

        $totalCollected = (float) $paymentBreakdown->sum('amount');
        $presentAccumulated = round($previousAccumulated + $totalCollected, 2);
        $actualNonCash  = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('amount');

        $reportData = [
            'from_date'            => $start->toDateString(),
            'to_date'              => $end->toDateString(),
            'branch_id'            => $branchId,
            'gross_sales'          => $gross,
            'net_sales'            => $netSales,
            'total_discounts'      => $totalDiscounts,
            'total_void_amount'    => $voidAmount,
            'transaction_count'    => $this->saleRepo->getSalesCountBetween($start, $end, $branchId),
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
            'reset_counter'        => 0,
            'previous_accumulated' => $previousAccumulated,
            'present_accumulated'  => $presentAccumulated,
            'sales_for_the_day'    => $totalCollected,
            'category_breakdown'   => [],
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

    public function getMallReport(string $date, string $mallName, ?int $branchId = null): array
    {
        $from = Carbon::parse($date)->startOfDay();
        $to   = Carbon::parse($date)->endOfDay();

        $gross = $this->saleRepo->getSalesSumBetween($from, $to, $branchId);
        $netSales = round($gross / 1.12, 2);
        $tax = round($gross - $netSales, 2);

        return [
            'mall'              => $mallName,
            'date'              => $from->toDateString(),
            'branch_id'         => $branchId,
            'gross_sales'       => $gross,
            'net_sales'         => $netSales,
            'tax_amount'        => $tax,
            'transaction_count' => $this->saleRepo->getSalesCountBetween($from, $to, $branchId),
            'tenant_id'         => 'LUCKYBOBA-001',
            'generated_at'      => now()->toDateTimeString(),
        ];
    }

    public function getZReadingHistory(?int $branchId = null, int $limit = 50): \Illuminate\Support\Collection
    {
        return $this->saleRepo->getZReadingsHistory($branchId, $limit);
    }

    /**
     * Option 1: Status Check
     */
    public function checkZReadingStatus(string $date, ?int $branchId = null): array
    {
        $day = Carbon::parse($date)->toDateString();
        
        $zReading = ZReading::where('reading_date', $day)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->first();

        // Check if there are any completed sales for this date
        $start = Carbon::parse($day)->startOfDay();
        $end   = Carbon::parse($day)->endOfDay();
        $hasSales = $this->saleRepo->getSalesCountBetween($start, $end, $branchId) > 0;

        return [
            'exists'    => (bool) $zReading,
            'is_closed' => (bool) ($zReading?->is_closed ?? false),
            'closed_at' => $zReading?->closed_at,
            'has_sales' => $hasSales,
            'date'      => $day,
        ];
    }

    /**
     * Option 3: Gap Analysis
     */
    public function getZReadingGaps(?int $branchId = null, int $days = 30): array
    {
        $gaps = [];
        $today = Carbon::today();
        
        for ($i = 1; $i <= $days; $i++) {
            $date = $today->copy()->subDays($i);
            $dateStr = $date->toDateString();
            
            // Check if Z-Reading exists
            $exists = ZReading::where('reading_date', $dateStr)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->exists();
                
            if (!$exists) {
                // Check if there were sales on that day
                $hasSales = $this->saleRepo->getSalesCountBetween($date->copy()->startOfDay(), $date->copy()->endOfDay(), $branchId) > 0;
                if ($hasSales) {
                    $gaps[] = $dateStr;
                }
            }
        }
        
        return $gaps;
    }
}
