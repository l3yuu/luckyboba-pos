<?php

namespace App\Repositories;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Branch;
use App\Services\SalesDashboardService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReportRepository implements ReportRepositoryInterface
{
    public function getFoodMenu(): mixed
    {
        return DB::table('menu_items')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select(
                'menu_items.name as Product_Name',
                'categories.name as Category',
                'menu_items.barcode as SKU',
                'menu_items.quantity as Current_Stock',
                'menu_items.cost as Cost_Price',
                'menu_items.price as Selling_Price'
            )
            ->where('categories.type', '!=', 'standard')
            ->orderBy('categories.name')
            ->get();
    }

    public function getSalesReport(string $from, string $to, string $type, ?int $branchId, ?int $shift = null): mixed
    {
        switch ($type) {
            case 'SUMMARY':
                return DB::table('sales')
                    ->select(
                        DB::raw('DATE(created_at) as Sales_Date'),
                        DB::raw('COUNT(id) as Total_Orders'),
                        DB::raw('SUM(total_amount) as Daily_Revenue')
                    )
                    ->whereBetween('created_at', [$from, $to])
                    ->where('status', 'completed')
                    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->when($shift,    fn($q) => $q->where('shift', $shift))
                    ->groupBy('Sales_Date')
                    ->orderBy('Sales_Date', 'desc')
                    ->get();

            case 'SOLD_ITEMS':
                return DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->select(
                        'sale_items.product_name as Item_Name',
                        DB::raw('SUM(sale_items.quantity) as Total_Qty'),
                        DB::raw('SUM(sale_items.final_price) as Total_Revenue')
                    )
                    ->whereBetween('sales.created_at', [$from, $to])
                    ->where('sales.status', 'completed')
                    ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                    ->when($shift,    fn($q) => $q->where('sales.shift', $shift))
                    ->groupBy('sale_items.product_name')
                    ->get();

            case 'PAYMENTS':
                return Sale::whereBetween('created_at', [$from, $to])
                    ->select('invoice_number as Invoice', 'payment_method as Method', 'total_amount as Amount', 'created_at as Date')
                    ->where('status', 'completed')
                    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->when($shift,    fn($q) => $q->where('shift', $shift))
                    ->get();

            default:
                return Sale::whereBetween('created_at', [$from, $to])
                    ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
                    ->whereIn('status', ['completed', 'cancelled'])
                    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->when($shift,    fn($q) => $q->where('shift', $shift))
                    ->orderBy('created_at', 'desc')
                    ->get();
        }
    }

    public function getSummaryData(string $from, string $to, ?int $branchId, ?int $shift = null): array
    {
        $summary = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shift,    fn($q) => $q->where('shift', $shift))
            ->select(
                DB::raw('DATE(created_at) as Sales_Date'),
                DB::raw('COUNT(id) as Total_Orders'),
                DB::raw('SUM(total_amount) as Daily_Revenue')
            )
            ->groupBy('Sales_Date')
            ->orderBy('Sales_Date', 'desc')
            ->get();

        $discountCol = \Schema::hasColumn('sales', 'total_discount') ? 'total_discount' : 
                      (\Schema::hasColumn('sales', 'discount_amount') ? 'discount_amount' : "0");

        $totals = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shift,    fn($q) => $q->where('shift', $shift))
            ->select(
                DB::raw("SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as gross_sales"),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN {$discountCol} ELSE 0 END) as total_discounts"),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN total_amount ELSE 0 END) as total_voids")
            )->first();

        $totalGross     = $totals->gross_sales ?? 0;
        $totalDiscounts = $totals->total_discounts ?? 0;
        $totalVoids     = $totals->total_voids ?? 0;

        return [
            'summary_data'      => $summary,
            'total_discounts'   => (float) $totalDiscounts,
            'total_void_amount' => (float) $totalVoids,
            'gross_sales'       => (float) $totalGross,
            'from_date'         => $from,
            'to_date'           => $to,
        ];
    }

    public function getItemQuantities(?string $from = null, ?string $to = null, ?int $branchId = null, ?string $cashierName = null, ?int $shift = null): array
    {
        try {
            $query = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->leftJoin('bundles', 'sale_items.bundle_id', '=', 'bundles.id')
                ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->leftJoin('cups', 'categories.cup_id', '=', 'cups.id')
                ->where('sales.status', 'completed');

            if ($from && $to) {
                $query->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59']);
            } elseif ($from) {
                $query->whereDate('sales.created_at', $from);
            }

            if ($branchId) {
                $query->where('sales.branch_id', $branchId);
            }

            if ($shift) {
                $query->where('sales.shift', $shift);
            }

            if ($cashierName) {
                $query->where('sales.cashier_name', $cashierName);
            }

            $rawItems = $query->select(
                'sale_items.*',
                DB::raw("CASE WHEN sale_items.bundle_id IS NOT NULL THEN COALESCE(bundles.display_name, bundles.name, sale_items.product_name) ELSE sale_items.product_name END as resolved_product_name"),
                DB::raw("COALESCE(bundles.category, categories.name, 'UNCATEGORIZED') as category_name"),
                DB::raw("COALESCE(cups.size_m, 'M') as cup_size_m"),
                DB::raw("COALESCE(cups.size_l, 'L') as cup_size_l")
            )
            ->get();

            Log::info("ReportRepository::getItemQuantities found " . $rawItems->count() . " items", [
                'from' => $from,
                'to' => $to,
                'branch_id' => $branchId,
                'cashier' => $cashierName
            ]);

            $globalAddonSummary = [];

            $groupedData = $rawItems->groupBy('category_name')->map(function ($items, $category) use (&$globalAddonSummary) {
                $productSummary = $items->groupBy(function ($item) {
                    $name = $item->resolved_product_name ?? $item->product_name;
                    $s = $item->size ?? 'none';
                    $label = $item->cup_size_label;
                    if (!$label || $label === 'none') {
                        if ($s === 'L') $label = $item->cup_size_l ?? 'L';
                        elseif ($s === 'M' || $s === 'none') $label = $item->cup_size_m ?? ($s === 'none' ? 'Standard' : 'M');
                        else $label = strtoupper($s);
                    }
                    return $name . '||' . $label;
                })->map(function ($pGroup) use (&$globalAddonSummary) {
                    $firstItem = $pGroup->first();
                    $quantity = (int) $pGroup->sum('quantity');

                    $name = $firstItem->resolved_product_name ?? $firstItem->product_name;
                    $s = $firstItem->size ?? 'none';
                    $label = $firstItem->cup_size_label;
                    if (!$label || $label === 'none') {
                        if ($s === 'L') $label = $firstItem->cup_size_l ?? 'L';
                        elseif ($s === 'M' || $s === 'none') $label = $firstItem->cup_size_m ?? ($s === 'none' ? 'Standard' : 'M');
                        else $label = strtoupper($s);
                    }

                    $addonCounts = [];
                    foreach ($pGroup as $item) {
                        if ($item->add_ons) {
                            $addons = json_decode($item->add_ons, true);
                            if (is_array($addons)) {
                                foreach ($addons as $addon) {
                                    $addonName = $addon['name'] ?? null;
                                    if ($addonName) {
                                        $addonCounts[$addonName] = ($addonCounts[$addonName] ?? 0) + ($addon['quantity'] ?? 1);
                                        $globalAddonSummary[$addonName] = ($globalAddonSummary[$addonName] ?? 0) + ($addon['quantity'] ?? 1);
                                    }
                                }
                            }
                        }
                    }

                    ksort($addonCounts);
                    $formattedAddons = [];
                    foreach ($addonCounts as $name => $qty) {
                        $formattedAddons[] = ['name' => $name, 'qty' => $qty];
                    }

                    return [
                        'product_name' => $name,
                        'size'         => $label,
                        'total_qty'    => $quantity,
                        'total_sales'  => (float) $pGroup->sum('final_price'),
                        'add_ons'      => $formattedAddons,
                    ];
                })->values();

                return [
                    'category_name'  => $category,
                    'products'       => $productSummary,
                    'category_total' => (float) $productSummary->sum('total_sales'),
                ];
            })->values();

            ksort($globalAddonSummary);
            $globalAddonList = [];
            foreach ($globalAddonSummary as $name => $qty) {
                $globalAddonList[] = ['name' => $name, 'qty' => $qty];
            }

            $grandTotal = (float) $rawItems->sum('final_price');

            return [
                'date'                => $from,
                'report_type'         => 'qty_items',
                'categories'          => $groupedData,
                'all_addons_summary'  => $globalAddonList,
                'grand_total_revenue' => round($grandTotal, 2),
                'vatable_sales'       => round($grandTotal / 1.12, 2),
                'vat_amount'          => round($grandTotal - ($grandTotal / 1.12), 2),
                'prepared_by'         => $cashierName,
            ];
        } catch (\Throwable $e) {
            Log::error("ReportRepository getItemQuantities Error: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'date' => $from,
                'branchId' => $branchId,
                'cashierName' => $cashierName
            ]);
            throw $e;
        }
    }

    public function getHourlySales(string $date, ?int $branchId, ?int $shift = null): mixed
    {
        return Sale::whereDate('created_at', $date)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shift,    fn($q) => $q->where('shift', $shift))
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();
    }

    public function getCashCountSummary(string $date, ?int $branchId, string $cashierName, ?int $shift = null): array
    {
        $query = DB::table('cash_counts')
            ->where(function ($q) use ($date) {
                $q->whereDate('date', $date)
                  ->orWhereDate('created_at', $date);
            });

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($shift) {
            $query->where('shift', $shift);
        }

        $cashCount = $query->latest()->first();

        if (!$cashCount) {
            return [
                'cash_count'    => null,
                'denominations' => [],
                'grand_total'   => 0,
                'expected_amount' => 0,
                'actual_amount'   => 0,
                'short_over'      => 0,
                'date'            => $date,
                'remarks'         => '',
                'message'       => 'No cash count recorded for this date.',
                'prepared_by'   => $cashierName,
            ];
        }

        $breakdown = $cashCount->breakdown ?? $cashCount->denominations_data ?? '[]';
        if (is_string($breakdown)) {
            $breakdown = json_decode($breakdown, true) ?? [];
        }

        $allDenoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

        $denominations = collect($allDenoms)->map(function ($denom) use ($breakdown) {
            $qty = 0;
            foreach ($breakdown as $key => $val) {
                if ((float)$key === (float)$denom) {
                    $qty = (int)$val;
                    break;
                }
            }
            return [
                'label' => $denom == 0.25 ? '0.25' : number_format((float)$denom, 0),
                'qty'   => $qty,
                'total' => (float)$denom * $qty,
            ];
        })->values()->toArray();

        $actualAmount   = (float) ($cashCount->actual_amount  ?? $cashCount->total_amount  ?? 0);
        $expectedAmount = (float) ($cashCount->expected_amount ?? $cashCount->expected_cash ?? 0);
        $shortOver      = (float) ($cashCount->short_over      ?? ($actualAmount - $expectedAmount));

        return [
            'cash_count' => [
                'denominations' => $denominations,
                'grand_total'   => $actualAmount,
            ],
            'expected_amount' => $expectedAmount,
            'actual_amount'   => $actualAmount,
            'short_over'      => $shortOver,
            'date'            => $cashCount->date ?? $date,
            'remarks'         => $cashCount->remarks ?? '',
            'prepared_by'     => $cashierName,
        ];
    }

    public function getVoidLogs(string $date, ?int $branchId, ?int $shift = null): mixed
    {
        $hasVoidReason = \Schema::hasColumn('sales', 'void_reason');
        $hasRemarks    = \Schema::hasColumn('sales', 'remarks');

        $reasonExpr = 'invoice_number';
        if ($hasVoidReason && $hasRemarks) {
            $reasonExpr = "COALESCE(NULLIF(void_reason, ''), NULLIF(remarks, ''), invoice_number)";
        } elseif ($hasVoidReason) {
            $reasonExpr = "COALESCE(NULLIF(void_reason, ''), invoice_number)";
        }

        return Sale::query()
            ->leftJoin('users', 'sales.user_id', '=', 'users.id')
            ->whereDate('sales.created_at', $date)
            ->whereIn('sales.status', ['cancelled', 'voided', 'pending'])
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->when($shift,    fn($q) => $q->where('sales.shift', $shift))
            ->select([
                'sales.id',
                'sales.invoice_number as invoice',
                'sales.total_amount as amount',
                'sales.status',
                'sales.created_at',
                'users.name as cashier',
                DB::raw("$reasonExpr as reason"),
            ])
            ->orderBy('sales.created_at', 'desc')
            ->get();
    }

    public function getExportSalesData(Carbon $startDate, Carbon $endDate, ?int $branchId): array
    {
        $salesQuery = DB::table('sales')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
        }

        $totals = (clone $salesQuery)->select(
            DB::raw('SUM(total_amount) as grand_total'),
            DB::raw('COUNT(id)         as total_orders'),
            DB::raw('AVG(total_amount) as avg_order_value')
        )->first();

        $breakdown = (clone $salesQuery)->select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(id)         as orders'),
            DB::raw('SUM(total_amount) as revenue')
        )
        ->groupBy(DB::raw('DATE(created_at)'))
        ->orderBy('date')
        ->get();

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity)    as total_quantity'),
                DB::raw('SUM(sale_items.final_price * sale_items.quantity) as total_revenue')
            )
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit(20)
            ->get();

        $paymentMethods = (clone $salesQuery)->select(
            'payment_method',
            DB::raw('COUNT(id)         as count'),
            DB::raw('SUM(total_amount) as revenue')
        )
        ->groupBy('payment_method')
        ->orderByDesc('revenue')
        ->get();

        $branchBreakdown = collect();
        if (!$branchId) {
            $branchBreakdown = DB::table('sales')
                ->join('branches', 'sales.branch_id', '=', 'branches.id')
                ->where('sales.status', 'completed')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->select(
                    'branches.name as branch_name',
                    DB::raw('COUNT(sales.id)         as total_orders'),
                    DB::raw('SUM(sales.total_amount) as total_revenue'),
                    DB::raw('AVG(sales.total_amount) as avg_order')
                )
                ->groupBy('branches.id', 'branches.name')
                ->orderByDesc('total_revenue')
                ->get();
        }

        $voidedTotal = DB::table('sales')
            ->where('status', 'cancelled')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        return [
            'totals' => $totals,
            'breakdown' => $breakdown,
            'topProducts' => $topProducts,
            'paymentMethods' => $paymentMethods,
            'branchBreakdown' => $branchBreakdown,
            'voidedTotal' => $voidedTotal,
        ];
    }

    public function getExportItemsData(string $date, ?int $branchId): mixed
    {
        return SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.final_price) as total_sales')
            )
            ->groupBy('sale_items.product_name')
            ->get();
    }

    public function getSalesSummary(string $from, string $to, ?int $branchId, ?int $shift = null): array
    {
        $data = $this->getSummaryData($from, $to, $branchId, $shift);
        $gross = $data['gross_sales'];

        $isVat = true;
        if ($branchId) {
            $branch = Branch::select('vat_type')->find($branchId);
            $isVat  = $branch?->vat_type !== 'non_vat';
        }

        $salesRepo = app(\App\Repositories\SaleRepositoryInterface::class);
        $discounts = $salesRepo->getDiscountsBreakdown(Carbon::parse($from), Carbon::parse($to), $branchId);

        $scDiscount       = $discounts['sc_discount'] ?? 0;
        $pwdDiscount      = $discounts['pwd_discount'] ?? 0;
        $diplomatDiscount = $discounts['diplomat_discount'] ?? 0;
        $otherDiscount    = $discounts['other_discount'] ?? 0;

        $scPwdDiscount  = $scDiscount + $pwdDiscount;
        $totalDiscounts = $scPwdDiscount + $diplomatDiscount + $otherDiscount;

        $vatData = DB::table('sales')
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select(
                DB::raw('SUM(vat_amount) as total_vat'),
                DB::raw('SUM(vatable_sales) as total_vatable')
            )->first();

        $salesVatTotal     = (float) ($vatData->total_vat ?? 0);
        $salesVatableSales = (float) ($vatData->total_vatable ?? 0);

        $vatAmount    = $isVat ? round($salesVatTotal,     2) : 0.0;
        $vatableSales = $isVat ? round($salesVatableSales, 2) : 0.0;

        $vatExemptBase  = $isVat ? round($scPwdDiscount / 0.20, 2) : 0.0;
        $vatExemptSales = $isVat ? round($vatExemptBase - $scPwdDiscount, 2) : 0.0;

        $preDiscountGross = round($gross + $totalDiscounts + $salesVatTotal, 2);

        $paymentBreakdown = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->selectRaw('payment_method as method, SUM(total_amount) as amount')
            ->groupBy('payment_method')
            ->get();

        return array_merge($data, [
            'payment_breakdown'  => $paymentBreakdown,
            'vatable_sales'      => $vatableSales,
            'vat_amount'         => $vatAmount,
            'vat_exempt_sales'   => $vatExemptSales,
            'is_vat'             => $isVat,
            'sc_discount'        => round($scDiscount,       2),
            'pwd_discount'       => round($pwdDiscount,      2),
            'diplomat_discount'  => round($diplomatDiscount, 2),
            'other_discount'     => round($otherDiscount,    2),
            'sc_pwd_discount'    => round($scPwdDiscount,    2),
            'total_discounts'    => round($totalDiscounts,   2),
            'pre_discount_gross' => $preDiscountGross,
            'total_senior_pax'   => 0,
            'total_pwd_pax'      => 0,
            'total_diplomat_pax' => 0,
        ]);
    }
}
