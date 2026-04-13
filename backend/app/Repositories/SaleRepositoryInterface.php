<?php

namespace App\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;

interface SaleRepositoryInterface
{
    /** Analytics Chart Methods */
    public function getSalesChartData(Carbon $startDate, Carbon $endDate, string $groupBy, ?int $branchId = null): Collection;
    
    /** Stats & Aggregates */
    public function getSalesSumBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float;
    public function getSalesCountBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): int;
    public function getVoidSalesBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float;
    public function getTaxAndVatAggregates(Carbon $startDate, Carbon $endDate, ?int $branchId = null): object;
    
    public function getTopSellers(Carbon $startDate, Carbon $endDate, int $limit = 1, ?int $branchId = null): mixed;
    public function getItemsSoldBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection;
    public function getCategoryItemSummary(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection;
    public function getTotalQtySoldBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): int;
    
    /** Receipts (SI) & Voids */
    public function getFirstSiNumberBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): string;
    public function getLastSiNumberBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): string;
    public function getVoidCountBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): int;
    
    /** Discounts & Payments */
    public function getDiscountsBreakdown(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array;
    public function getPaymentMethodBreakdown(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection;
    public function getNetCashPayments(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float;
    
    /** Raw Material & Transaction Dependencies */
    public function getCashTransactionsSum(Carbon $startDate, Carbon $endDate, array $types, ?int $branchId = null): float;
    
    /** Miscellaneous Reports */
    public function getHourlySalesBreakdown(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection;
    public function getZReadingsHistory(?int $branchId = null, int $limit = 50): Collection;
    public function getZReadingsCountUpTo(Carbon $date, ?int $branchId = null, bool $singleDay = true): int;
    public function getSalesAccumulatedUpTo(Carbon $date, ?int $branchId = null): float;
}
