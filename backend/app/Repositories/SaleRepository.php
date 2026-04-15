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

    public function getGrossItemSalesBetween(Carbon $startDate, Carbon $endDate, ?int $branchId = null): float
    {
        // Gross sales = ordered line totals before any order-level discounts/VAT split adjustments.
        return (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->sum('sale_items.final_price');
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

        $itemAggregates = (clone $base)
            ->select(
                DB::raw("SUM(CASE WHEN discount_label LIKE '%SENIOR%' THEN sale_items.discount_amount ELSE 0 END) as sc_item"),
                DB::raw("SUM(CASE WHEN discount_label LIKE '%PWD%' THEN sale_items.discount_amount ELSE 0 END) as pwd_item"),
                DB::raw("SUM(CASE WHEN discount_label LIKE '%DIPLOMAT%' THEN sale_items.discount_amount ELSE 0 END) as diplomat_item"),
                DB::raw("SUM(CASE WHEN 
                    COALESCE(discount_label, '') != '' 
                    AND discount_label NOT LIKE '%SENIOR%' 
                    AND discount_label NOT LIKE '%PWD%' 
                    AND discount_label NOT LIKE '%DIPLOMAT%' 
                    THEN sale_items.discount_amount ELSE 0 END) as other_item")
            )->first();

        $scItem       = round((float) ($itemAggregates->sc_item ?? 0), 2);
        $pwdItem      = round((float) ($itemAggregates->pwd_item ?? 0), 2);
        $diplomatItem = (float) ($itemAggregates->diplomat_item ?? 0);
        $itemLevelOther = (float) ($itemAggregates->other_item ?? 0);

        $orderBase = DB::table('sales')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId));

        $orderAggregates = (clone $orderBase)->select(
            DB::raw('SUM(sc_discount_amount) as sc_order'),
            DB::raw('SUM(pwd_discount_amount) as pwd_order'),
            DB::raw('SUM(diplomat_discount_amount) as diplomat_order'),
            DB::raw('SUM(other_discount_amount) as other_order')
        )->first();

        $scOrder       = round((float) ($orderAggregates->sc_order ?? 0), 2);
        $pwdOrder      = round((float) ($orderAggregates->pwd_order ?? 0), 2);
        $diplomatOrder = (float) ($orderAggregates->diplomat_order ?? 0);
        $otherOrder    = (float) ($orderAggregates->other_order ?? 0);

        return [
            // Use max() to prevent double-counting when both item-level and
            // order-level track the same discount (POS may send both).
            'sc_discount'       => round(max($scItem, $scOrder), 2),
            'pwd_discount'      => round(max($pwdItem, $pwdOrder), 2),
            'diplomat_discount' => round(max($diplomatItem, $diplomatOrder), 2),
            // 'Other' can be additive: item-level promos + order-level misc are different
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
