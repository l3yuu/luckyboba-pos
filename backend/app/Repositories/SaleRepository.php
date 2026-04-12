<?php

namespace App\Repositories;

use App\Models\Sale;
use App\Models\ZReading;
use Illuminate\Support\Collection;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SaleRepository implements SaleRepositoryInterface
{
    public function getSalesChartData(Carbon $startDate, Carbon $endDate, string $groupBy, ?int $branchId = null): Collection
    {
        $query = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        if ($groupBy === 'daily') {
            return $query->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('DATE_FORMAT(created_at, "%a") as day'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('date', 'day')
            ->orderBy('date', 'ASC')
            ->get();
        } elseif ($groupBy === 'monthly') {
            return $query->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();
        } elseif ($groupBy === 'weekly') {
            return $query->select(
                DB::raw('DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) as week_start'),
                DB::raw('SUM(total_amount) as value')
            )
            ->groupBy('week_start')
            ->orderBy('week_start', 'ASC')
            ->get();
        }

        return collect([]);
    }

    public function getSalesSumBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float
    {
        return (float) DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');
    }

    public function getSalesCountBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): int
    {
        return (int) DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();
    }

    public function getVoidSalesBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float
    {
        return (float) DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');
    }

    public function getVoidCountBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): int
    {
        return (int) DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->count();
    }

    public function getTaxAndVatAggregates(Carbon $startDate, Carbon $endDate, ?int $branchId = null): object
    {
        return DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->selectRaw('SUM(vatable_sales) as vatable_sales, SUM(vat_amount) as vat_amount, SUM(vat_exempt_sales) as vat_exempt_sales')
            ->first() ?? (object)['vatable_sales' => 0, 'vat_amount' => 0, 'vat_exempt_sales' => 0];
    }

    public function getTopSellers(Carbon $startDate, Carbon $endDate, int $limit = 1, ?int $branchId = null): mixed
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select('sale_items.product_name', DB::raw('SUM(sale_items.quantity) as total_qty'))
            ->groupBy('sale_items.product_name')
            ->orderBy('total_qty', 'DESC')
            ->limit($limit);

        return $limit === 1 ? $query->first() : $query->get();
    }

    public function getItemsSoldBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection
    {
        $saleSubtotalSql = '(SELECT SUM(si2.final_price * si2.quantity) FROM sale_items si2 WHERE si2.sale_id = sales.id)';
        $proratedAmount = "SUM(sale_items.final_price * sale_items.quantity * (sales.total_amount / NULLIF({$saleSubtotalSql}, 0)))";

        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name as name',
                DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw("{$proratedAmount} as amount")
            )
            ->groupBy('sale_items.product_name', 'categories.name')
            ->orderByDesc('amount')
            ->get();
    }

    public function getCategoryItemSummary(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection
    {
        $saleSubtotalSql = '(SELECT SUM(si2.final_price * si2.quantity) FROM sale_items si2 WHERE si2.sale_id = sales.id)';
        $proratedAmount = "SUM(sale_items.final_price * sale_items.quantity * (sales.total_amount / NULLIF({$saleSubtotalSql}, 0)))";

        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                DB::raw("COALESCE(categories.name, 'Uncategorized') as name"),
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw("'' as category"),
                DB::raw("{$proratedAmount} as amount")
            )
            ->groupBy('categories.name')
            ->orderByDesc('amount')
            ->get();
    }

    public function getTotalQtySoldBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): int
    {
        return (int) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->sum('sale_items.quantity');
    }

    public function getFirstSiNumberBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): string
    {
        return DB::table('receipts')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->orderBy('id', 'asc')
            ->value('si_number') ?? '0000000000';
    }

    public function getLastSiNumberBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): string
    {
        return DB::table('receipts')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->orderBy('id', 'desc')
            ->value('si_number') ?? '0000000000';
    }

    public function getDiscountsBreakdown(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        // Centralized previously duplicate logic
        $base = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId));

        $scItem = round((float) (clone $base)->where('sale_items.discount_label', 'LIKE', '%SENIOR%')->sum('sale_items.discount_amount'), 2);
        $pwdItem = round((float) (clone $base)->where('sale_items.discount_label', 'LIKE', '%PWD%')->sum('sale_items.discount_amount'), 2);
        $diplomatItem = (float) (clone $base)->where('sale_items.discount_label', 'LIKE', '%DIPLOMAT%')->sum('sale_items.discount_amount');

        $itemLevelOther = (float) (clone $base)
            ->where('sale_items.discount_label', 'NOT LIKE', '%SENIOR%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%PWD%')
            ->where('sale_items.discount_label', 'NOT LIKE', '%DIPLOMAT%')
            ->whereNotNull('sale_items.discount_label')
            ->where('sale_items.discount_label', '!=', '')
            ->sum('sale_items.discount_amount');

        $orderBase = DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $scOrder = round((float) (clone $orderBase)->sum('sc_discount_amount'), 2);
        $pwdOrder = round((float) (clone $orderBase)->sum('pwd_discount_amount'), 2);
        $diplomatOrder = (float) (clone $orderBase)->sum('diplomat_discount_amount');
        $otherOrder = (float) (clone $orderBase)->sum('other_discount_amount');

        return [
            'sc_discount'       => round($scItem + $scOrder, 2),
            'pwd_discount'      => round($pwdItem + $pwdOrder, 2),
            'diplomat_discount' => round($diplomatItem + $diplomatOrder, 2),
            'other_discount'    => round($itemLevelOther + $otherOrder, 2),
        ];
    }

    public function getPaymentMethodBreakdown(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection
    {
        $bindings = [$startDate, $endDate];
        $branchCondition = '';
        if ($branchId) {
            $branchCondition = 'AND branch_id = ?';
            $bindings[] = $branchId;
        }

        return collect(DB::select("
            SELECT method, SUM(net_amount) as amount
            FROM (
                SELECT
                    CASE
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('panda','foodpanda','food_panda','food panda') THEN 'food panda'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('grab','grabfood','grab food') THEN 'grab'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('master','master card','mastercard') THEN 'mastercard'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('visa','visa card') THEN 'visa'
                        WHEN charge_type IS NOT NULL AND charge_type != '' AND LOWER(TRIM(charge_type)) IN ('gcash','e-wallet','ewallet') THEN 'gcash'
                        WHEN charge_type IS NOT NULL AND charge_type != '' THEN LOWER(TRIM(charge_type))
                        WHEN LOWER(TRIM(payment_method)) IN ('panda','foodpanda','food_panda','food panda') THEN 'food panda'
                        WHEN LOWER(TRIM(payment_method)) IN ('grab','grabfood','grab food') THEN 'grab'
                        WHEN LOWER(TRIM(payment_method)) IN ('master','master card','mastercard') THEN 'mastercard'
                        WHEN LOWER(TRIM(payment_method)) IN ('visa','visa card') THEN 'visa'
                        WHEN LOWER(TRIM(payment_method)) IN ('gcash','e-wallet','ewallet') THEN 'gcash'
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

    public function getNetCashPayments(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float
    {
        return (float) DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where(fn($q) => $q->whereNull('charge_type')->orWhere('charge_type', ''))
            ->whereNotIn(DB::raw('LOWER(TRIM(payment_method))'), [
                'gcash', 'e-wallet', 'ewallet', 'visa', 'mastercard',
                'master card', 'master', 'visa card',
            ])
            ->sum('total_amount');
    }

    public function getCashTransactionsSum(Carbon $startDate, Carbon $endDate, array $types, ?int $branchId = null): float
    {
        return (float) DB::table('cash_transactions')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('type', $types)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('amount');
    }

    public function getHourlySalesBreakdown(Carbon $startDate, Carbon $endDate, ?int $branchId = null): Collection
    {
        return DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('hour')
            ->get();
    }

    public function getZReadingsHistory(?int $branchId = null, int $limit = 50): Collection
    {
        return DB::table('z_readings')
            ->join('branches', 'z_readings.branch_id', '=', 'branches.id')
            ->select(
                'z_readings.id',
                'z_readings.reading_date as date',
                'branches.name as branch_name',
                'z_readings.total_sales as gross',
                'z_readings.data',
                'z_readings.is_closed',
                'z_readings.closed_at',
                'z_readings.branch_id'
            )
            ->when($branchId, fn($q) => $q->where('z_readings.branch_id', $branchId))
            ->orderByDesc('z_readings.reading_date')
            ->limit($limit)
            ->get();
    }

    public function getZReadingsCountUpTo(Carbon $date, ?int $branchId = null, bool $singleDay = true): int
    {
        $query = ZReading::query()->when($branchId, fn($q) => $q->where('branch_id', $branchId));
        if ($singleDay) {
            return (int) $query->count() + 1; // Since it considers previous read inclusive
        }
        return (int) $query->where('reading_date', '<=', $date->toDateString())->count();
    }

    public function getSalesAccumulatedUpTo(Carbon $date, ?int $branchId = null): float
    {
        return (float) ZReading::where('reading_date', '<', $date->toDateString())
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_sales');
    }
}
