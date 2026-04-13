<?php

namespace App\Repositories;

use Carbon\Carbon;

interface ReportRepositoryInterface
{
    public function getFoodMenu(): mixed;
    public function getSalesReport(string $from, string $to, string $type, ?int $branchId): mixed;
    public function getSummaryData(string $from, string $to, ?int $branchId): array;
    public function getItemQuantities(string $date, ?int $branchId, string $cashierName): array;
    public function getHourlySales(string $date, ?int $branchId): mixed;
    public function getCashCountSummary(string $date, ?int $branchId, string $cashierName): array;
    public function getVoidLogs(string $date, ?int $branchId): mixed;
    public function getExportSalesData(Carbon $startDate, Carbon $endDate, ?int $branchId): array;
    public function getExportItemsData(string $date, ?int $branchId): mixed;
    public function getSalesSummary(string $from, string $to, ?int $branchId): array;
}
