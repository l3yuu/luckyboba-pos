<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function resolveBranchId(Request $request): ?int
    {
        $user = auth('sanctum')->user() ?? $request->user();

        // Superadmin has no branch_id — always use query param
        // Branch manager/cashier still respect a query param override from superadmin context
        $qb = $request->query('branch_id');

        if ($qb !== null && $qb !== '') {
            $id = (int) $qb;
            return $id > 0 ? $id : null;  // guard against (int)"" = 0
        }

        // Fall back to the user's own branch
        if ($user?->branch_id) {
            return (int) $user->branch_id;
        }

        return null;
    }

    public function getFoodMenu()
    {
        try {
            $menu = DB::table('menu_items')
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

            return response()->json($menu->values());
        } catch (\Exception $e) {
            Log::error("Food Menu Report Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch menu items'], 500);
        }
    }

    public function getSalesReport(Request $request)
    {
        try {
            $from     = $request->query('from', date('Y-m-d')) . ' 00:00:00';
            $to       = $request->query('to',   date('Y-m-d')) . ' 23:59:59';
            $type     = $request->query('type', 'SALES');
            $branchId = $this->resolveBranchId($request);

            switch ($type) {
                case 'SUMMARY':
                    $data = DB::table('sales')
                        ->select(
                            DB::raw('DATE(created_at) as Sales_Date'),
                            DB::raw('COUNT(id) as Total_Orders'),
                            DB::raw('SUM(total_amount) as Daily_Revenue')
                        )
                        ->whereBetween('created_at', [$from, $to])
                        ->where('status', 'completed')
                        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                        ->groupBy('Sales_Date')
                        ->orderBy('Sales_Date', 'desc')
                        ->get();
                    break;

                case 'SOLD_ITEMS':
                    $data = DB::table('sale_items')
                        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                        ->select(
                            'sale_items.product_name as Item_Name',
                            DB::raw('SUM(sale_items.quantity) as Total_Qty'),
                            DB::raw('SUM(sale_items.final_price) as Total_Revenue')
                        )
                        ->whereBetween('sales.created_at', [$from, $to])
                        ->where('sales.status', 'completed')
                        ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                        ->groupBy('sale_items.product_name')
                        ->get();
                    break;

                case 'PAYMENTS':
                    $data = Sale::whereBetween('created_at', [$from, $to])
                        ->select('invoice_number as Invoice', 'payment_method as Method', 'total_amount as Amount', 'created_at as Date')
                        ->where('status', 'completed')
                        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                        ->get();
                    break;

                default:
                    $data = Sale::whereBetween('created_at', [$from, $to])
                        ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
                        ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                        ->orderBy('created_at', 'desc')
                        ->get();
                    break;
            }

            return response()->json($data->values());

        } catch (\Exception $e) {
            Log::error("Sales Aggregator Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error: Check Laravel Logs'], 500);
        }
    }

    private function getSummaryData($from, $to, ?int $branchId = null)
    {
        try {
            $summary = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->select(
                    DB::raw('DATE(created_at) as Sales_Date'),
                    DB::raw('COUNT(id) as Total_Orders'),
                    DB::raw('SUM(total_amount) as Daily_Revenue')
                )
                ->groupBy('Sales_Date')
                ->orderBy('Sales_Date', 'desc')
                ->get();

            $totalGross = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_amount') ?? 0;

            $totalDiscounts = 0;
            if (\Schema::hasColumn('sales', 'total_discount')) {
                $totalDiscounts = Sale::whereBetween('created_at', [$from, $to])
                    ->where('status', 'completed')
                    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->sum('total_discount');
            } elseif (\Schema::hasColumn('sales', 'discount_amount')) {
                $totalDiscounts = Sale::whereBetween('created_at', [$from, $to])
                    ->where('status', 'completed')
                    ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                    ->sum('discount_amount');
            }

            $totalVoids = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_amount') ?? 0;

            return [
                'summary_data'      => $summary,
                'total_discounts'   => (float) $totalDiscounts,
                'total_void_amount' => (float) $totalVoids,
                'gross_sales'       => (float) $totalGross,
                'from_date'         => $from,
                'to_date'           => $to,
            ];
        } catch (\Exception $e) {
            Log::error("Summary Logic Error: " . $e->getMessage());
            throw $e;
        }
    }

    private function getDetailedData($from, $to, ?int $branchId = null)
    {
        $transactions = Sale::whereBetween('created_at', [$from, $to])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
            ->orderBy('created_at', 'desc')
            ->get();
        return ['search_results' => $transactions, 'transactions' => $transactions];
    }

    private function getGeneralSalesData($from, $to, ?int $branchId = null)
    {
        $data = Sale::whereBetween('created_at', [$from, $to])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
            ->orderBy('created_at', 'desc')
            ->get();
        return ['transactions' => $data];
    }

    public function getItemQuantities(Request $request)
    {
        $date        = $request->query('date');
        $branchId    = $this->resolveBranchId($request);
        $user        = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $rawItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('bundles', 'sale_items.bundle_id', '=', 'bundles.id')
            ->leftJoin('cups', 'categories.cup_id', '=', 'cups.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', 'completed')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                DB::raw("COALESCE(bundles.category, categories.name, 'UNCATEGORIZED') as category_name"),
                DB::raw("COALESCE(categories.type, 'drink') as category_type"),
                'sale_items.*',
                DB::raw("CASE WHEN sale_items.bundle_id IS NOT NULL THEN COALESCE(bundles.display_name, bundles.name, sale_items.product_name) ELSE sale_items.product_name END as resolved_product_name"),
                DB::raw("COALESCE(cups.size_m, 'M') as cup_size_m"),
                DB::raw("COALESCE(cups.size_l, 'L') as cup_size_l")
            )
            ->get();

        $globalAddonSummary = [];

        $groupedData = $rawItems->groupBy('category_name')->map(function ($items, $category) use (&$globalAddonSummary) {
            $productSummary = $items->groupBy(function ($item) {
                $name      = $item->resolved_product_name ?? $item->product_name;
                $sizeLabel = $item->cup_size_label ?? null;
                return $name . '||' . ($sizeLabel ?? 'none');
            })->map(function ($pGroup) use (&$globalAddonSummary) {
                $firstItem = $pGroup->first();
                $sizeLabel = $firstItem->cup_size_label ?? null;

                $productAddOnCounts = [];
                foreach ($pGroup as $item) {
                    $addons = json_decode($item->add_ons) ?? [];
                    foreach ($addons as $addonName) {
                        $productAddOnCounts[$addonName] = ($productAddOnCounts[$addonName] ?? 0) + $item->quantity;
                        $globalAddonSummary[$addonName] = ($globalAddonSummary[$addonName] ?? 0) + $item->quantity;
                    }
                }

                $formattedAddons = [];
                foreach ($productAddOnCounts as $name => $qty) {
                    $formattedAddons[] = ['name' => $name, 'qty' => $qty];
                }

                return [
                    'product_name' => $firstItem->resolved_product_name ?? $firstItem->product_name,
                    'size'         => $sizeLabel,
                    'total_qty'    => (int) $pGroup->sum('quantity'),
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

        $grandTotal = (float) $rawItems->sum('final_price');
        $addonsList = [];
        foreach ($globalAddonSummary as $name => $qty) {
            $addonsList[] = ['name' => $name, 'qty' => $qty];
        }

        return response()->json([
            'date'                => $date,
            'report_type'         => 'qty_items',
            'categories'          => $groupedData,
            'all_addons_summary'  => $addonsList,
            'grand_total_revenue' => round($grandTotal, 2),
            'vatable_sales'       => round($grandTotal / 1.12, 2),
            'vat_amount'          => round($grandTotal - ($grandTotal / 1.12), 2),
            'prepared_by'         => $cashierName,
        ]);
    }

    public function getHourlySales(Request $request)
    {
        $date        = $request->query('date');
        $branchId    = $this->resolveBranchId($request);
        $user        = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $hourlyData = Sale::whereDate('created_at', $date)
            ->where('status', '!=', 'cancelled')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'hourly_data' => $hourlyData,
            'prepared_by' => $cashierName,
        ]);
    }

    public function getCashCountSummary(Request $request)
    {
        $date     = $request->query('date', now()->toDateString());
        $branchId = $this->resolveBranchId($request);

        try {
            $query = DB::table('cash_counts')
                ->where(function ($q) use ($date) {
                    $q->whereDate('date', $date)
                      ->orWhereDate('created_at', $date);
                });

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $cashCount = $query->latest()->first();

            if (!$cashCount) {
                return response()->json([
                    'cash_count'    => null,
                    'denominations' => [],
                    'grand_total'   => 0,
                    'message'       => 'No cash count recorded for this date.',
                ]);
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

            $user = auth('sanctum')->user() ?? $request->user();

            return response()->json([
                'cash_count' => [
                    'denominations' => $denominations,
                    'grand_total'   => $actualAmount,
                ],
                'expected_amount' => $expectedAmount,
                'actual_amount'   => $actualAmount,
                'short_over'      => $shortOver,
                'date'            => $cashCount->date ?? $date,
                'remarks'         => $cashCount->remarks ?? '',
                'prepared_by'     => $user ? $user->name : 'System Admin',
            ]);

        } catch (\Exception $e) {
            Log::error('CashCount summary error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function getVoidLogs(Request $request)
    {
        try {
            $date     = $request->query('date', now()->toDateString());
            $branchId = $this->resolveBranchId($request);

            $hasVoidReason = \Schema::hasColumn('sales', 'void_reason');
            $hasRemarks    = \Schema::hasColumn('sales', 'remarks');

            $reasonExpr = 'invoice_number';
            if ($hasVoidReason && $hasRemarks) {
                $reasonExpr = "COALESCE(NULLIF(void_reason, ''), NULLIF(remarks, ''), invoice_number)";
            } elseif ($hasVoidReason) {
                $reasonExpr = "COALESCE(NULLIF(void_reason, ''), invoice_number)";
            }

            $voids = Sale::query()
                ->leftJoin('users', 'sales.user_id', '=', 'users.id')
                ->whereDate('sales.created_at', $date)
                ->whereIn('sales.status', ['cancelled', 'voided', 'pending'])
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
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

            return response()->json([
                'logs'        => $voids,
                'prepared_by' => auth()->user()->name ?? 'System Admin',
            ]);

        } catch (\Exception $e) {
            Log::error("Void Logs Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error', 'message' => $e->getMessage()], 500);
        }
    }

    public function exportSales(Request $request)
    {
        $period   = $request->query('period');       // daily | weekly | monthly
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');
        $branchId = $request->query('branch_id');

        // Resolve date range — period-based or explicit range
        if ($period && in_array($period, ['daily', 'weekly', 'monthly'])) {
            $anchor = \Carbon\Carbon::today();
            [$startDate, $endDate] = match ($period) {
                'daily'   => [$anchor->copy()->startOfDay(),   $anchor->copy()->endOfDay()],
                'weekly'  => [$anchor->copy()->startOfWeek(),  $anchor->copy()->endOfWeek()],
                'monthly' => [$anchor->copy()->startOfMonth(), $anchor->copy()->endOfMonth()],
            };
        } elseif ($dateFrom && $dateTo) {
            $startDate = \Carbon\Carbon::parse($dateFrom)->startOfDay();
            $endDate   = \Carbon\Carbon::parse($dateTo)->endOfDay();
        } else {
            // Fallback: today
            $startDate = \Carbon\Carbon::today()->startOfDay();
            $endDate   = \Carbon\Carbon::today()->endOfDay();
            $period    = 'daily';
        }

        $fromStr = $startDate->toDateString();
        $toStr   = $endDate->toDateString();

        // Resolve branch name
        $branchName = 'All Branches';
        if ($branchId) {
            $branchName = DB::table('branches')->where('id', $branchId)->value('name') ?? 'Unknown Branch';
        }

        $branchSlug = $branchId
            ? strtoupper(preg_replace('/[^a-zA-Z0-9]+/', '-', $branchName))
            : 'ALL-BRANCHES';

        $filename = "LuckyBoba_SalesReport_{$branchSlug}_{$fromStr}_to_{$toStr}.csv";

        // ── Query sales data ──────────────────────────────────────────────────
        $salesQuery = DB::table('sales')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
        }

        // Totals
        $totals = (clone $salesQuery)->select(
            DB::raw('SUM(total_amount) as grand_total'),
            DB::raw('COUNT(id)         as total_orders'),
            DB::raw('AVG(total_amount) as avg_order_value')
        )->first();

        // Daily breakdown
        $breakdown = (clone $salesQuery)->select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(id)         as orders'),
            DB::raw('SUM(total_amount) as revenue')
        )
        ->groupBy(DB::raw('DATE(created_at)'))
        ->orderBy('date')
        ->get();

        // Top products
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

        // Payment methods
        $paymentMethods = (clone $salesQuery)->select(
            'payment_method',
            DB::raw('COUNT(id)         as count'),
            DB::raw('SUM(total_amount) as revenue')
        )
        ->groupBy('payment_method')
        ->orderByDesc('revenue')
        ->get();

        // Branch breakdown (only when all branches)
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

        // Voided sales
        $voidedTotal = DB::table('sales')
            ->where('status', 'cancelled')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');

        $generatedAt  = now()->format('F d, Y h:i A');
        $grandTotal   = (float) ($totals->grand_total ?? 0);
        $totalOrders  = (int) ($totals->total_orders ?? 0);
        $avgOrder     = (float) ($totals->avg_order_value ?? 0);

        // ── Build CSV ─────────────────────────────────────────────────────────
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use (
            $generatedAt, $fromStr, $toStr, $branchName, $period,
            $grandTotal, $totalOrders, $avgOrder, $voidedTotal,
            $breakdown, $topProducts, $paymentMethods, $branchBreakdown, $branchId
        ) {
            $file = fopen('php://output', 'w');

            // BOM for Excel UTF-8 compatibility
            fwrite($file, "\xEF\xBB\xBF");

            // ── Report Header ──
            fputcsv($file, ['LUCKY BOBA POS - SALES REPORT']);
            fputcsv($file, ['Generated', $generatedAt]);
            fputcsv($file, ['Date Range', date('F d, Y', strtotime($fromStr)) . ' to ' . date('F d, Y', strtotime($toStr))]);
            if ($period) {
                fputcsv($file, ['Period', strtoupper($period)]);
            }
            fputcsv($file, ['Branch', $branchName]);
            fputcsv($file, []);

            // ── Summary ──
            fputcsv($file, ['SUMMARY']);
            fputcsv($file, ['Gross Revenue (PHP)', number_format($grandTotal, 2)]);
            fputcsv($file, ['Total Orders', $totalOrders]);
            fputcsv($file, ['Avg Order Value (PHP)', number_format($avgOrder, 2)]);
            fputcsv($file, ['Voided Sales (PHP)', number_format((float) $voidedTotal, 2)]);
            fputcsv($file, []);

            // ── Branch Breakdown (all branches mode) ──
            if (!$branchId && $branchBreakdown->count() > 0) {
                fputcsv($file, ['BRANCH BREAKDOWN']);
                fputcsv($file, ['#', 'Branch', 'Orders', 'Revenue (PHP)', 'Avg Order (PHP)', 'Revenue Share']);
                $rank = 1;
                foreach ($branchBreakdown as $b) {
                    $share = $grandTotal > 0 ? round(($b->total_revenue / $grandTotal) * 100, 1) : 0;
                    fputcsv($file, [
                        $rank++,
                        $b->branch_name,
                        (int) $b->total_orders,
                        number_format((float) $b->total_revenue, 2),
                        number_format((float) $b->avg_order, 2),
                        $share . '%',
                    ]);
                }
                fputcsv($file, []);
            }

            // ── Daily Breakdown ──
            if ($breakdown->count() > 0) {
                fputcsv($file, ['DAILY BREAKDOWN']);
                fputcsv($file, ['Date', 'Orders', 'Revenue (PHP)', 'Avg Order (PHP)']);
                foreach ($breakdown as $row) {
                    $orders = (int) $row->orders;
                    $rev    = (float) $row->revenue;
                    fputcsv($file, [
                        $row->date,
                        $orders,
                        number_format($rev, 2),
                        $orders > 0 ? number_format($rev / $orders, 2) : '0.00',
                    ]);
                }
                // Totals row
                fputcsv($file, [
                    'TOTAL',
                    $totalOrders,
                    number_format($grandTotal, 2),
                    $totalOrders > 0 ? number_format($grandTotal / $totalOrders, 2) : '0.00',
                ]);
                fputcsv($file, []);
            }

            // ── Top Products ──
            if ($topProducts->count() > 0) {
                $productRevTotal = $topProducts->sum('total_revenue');
                fputcsv($file, ['TOP PRODUCTS']);
                fputcsv($file, ['#', 'Product', 'Qty Sold', 'Revenue (PHP)', 'Revenue Share']);
                $rank = 1;
                foreach ($topProducts as $p) {
                    $share = $productRevTotal > 0 ? round(($p->total_revenue / $productRevTotal) * 100, 1) : 0;
                    fputcsv($file, [
                        $rank++,
                        $p->product_name,
                        (int) $p->total_quantity,
                        number_format((float) $p->total_revenue, 2),
                        $share . '%',
                    ]);
                }
                fputcsv($file, []);
            }

            // ── Payment Methods ──
            if ($paymentMethods->count() > 0) {
                $payTotal = $paymentMethods->sum('revenue');
                fputcsv($file, ['PAYMENT METHODS']);
                fputcsv($file, ['Method', 'Transactions', 'Revenue (PHP)', 'Share']);
                foreach ($paymentMethods as $pm) {
                    $share = $payTotal > 0 ? round(($pm->revenue / $payTotal) * 100, 1) : 0;
                    fputcsv($file, [
                        strtoupper($pm->payment_method ?? 'OTHER'),
                        (int) $pm->count,
                        number_format((float) $pm->revenue, 2),
                        $share . '%',
                    ]);
                }
                fputcsv($file, []);
            }

            fputcsv($file, ['--- End of Report ---']);
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function exportItems(Request $request)
    {
        $date     = $request->query('date', now()->toDateString());
        $branchId = $this->resolveBranchId($request);

        $items = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', '!=', 'cancelled')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.final_price) as total_sales')
            )
            ->groupBy('sale_items.product_name')
            ->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=lucky_boba_items_{$date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0",
        ];

        $callback = function () use ($items) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Product Name', 'Quantity Sold', 'Total Revenue']);
            foreach ($items as $item) {
                fputcsv($file, [$item->product_name, $item->total_qty, $item->total_sales]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function getSalesSummary(Request $request)
    {
        try {
            $from     = $request->query('from', now()->toDateString()) . ' 00:00:00';
            $to       = $request->query('to',   now()->toDateString()) . ' 23:59:59';
            $branchId = $this->resolveBranchId($request);

            $data  = $this->getSummaryData($from, $to, $branchId);
            $gross = $data['gross_sales'];

            // ── VAT type check ────────────────────────────────────────────────
            $isVat = true;
            if ($branchId) {
                $branch = \App\Models\Branch::select('vat_type')->find($branchId);
                $isVat  = $branch?->vat_type !== 'non_vat';
            }

            // ── Discounts ─────────────────────────────────────────────────────
            $salesService = app(\App\Services\SalesDashboardService::class);
            $discounts = $salesService->getDiscountSummary($from, $to, $branchId);

            $scDiscount       = $discounts['sc_discount']['total'] ?? 0;
            $pwdDiscount      = $discounts['pwd_discount']['total'] ?? 0;
            $diplomatDiscount = $discounts['diplomat_discount']['total'] ?? 0;
            $otherDiscount    = $discounts['other_discount']['total'] ?? 0;

            $scPwdDiscount  = $scDiscount + $pwdDiscount;
            $totalDiscounts = $scPwdDiscount + $diplomatDiscount + $otherDiscount;

            // ── VAT from stored sales records ─────────────────────────────────
            $salesVatTotal = (float) DB::table('sales')
                ->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('vat_amount');

            $salesVatableSales = (float) DB::table('sales')
                ->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('vatable_sales');

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

            return response()->json(array_merge($data, [
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
            ]));

        } catch (\Exception $e) {
            Log::error("getSalesSummary Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate summary report'], 500);
        }
    }

    public function getSalesDetailed(Request $request)
    {
        try {
            $date     = $request->query('date', now()->toDateString());
            $from     = $date . ' 00:00:00';
            $to       = $date . ' 23:59:59';
            $branchId = $this->resolveBranchId($request);

            $transactions = Sale::whereBetween('sales.created_at', [$from, $to])
                ->leftJoin('users', 'users.id', '=', 'sales.user_id')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                ->selectRaw('
                    sales.id,
                    sales.invoice_number                                                        as Invoice,
                    sales.total_amount                                                          as Amount,
                    sales.status                                                                as Status,
                    sales.created_at                                                            as Date_Time,
                    sales.payment_method                                                        as Method,
                    COALESCE(users.name, "N/A")                                                 as Cashier,
                    COALESCE(sales.vatable_sales, ROUND(sales.total_amount / 1.12, 2))          as Vatable,
                    COALESCE(sales.vat_amount, ROUND(sales.total_amount - (sales.total_amount / 1.12), 2)) as Tax,
                    0                                                                           as Disc_Pax,
                    (SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = sales.id)       as Items_Count
                ')
                ->orderBy('sales.created_at', 'desc')
                ->get();

            return response()->json([
                'transactions' => $transactions,
            ]);

        } catch (\Exception $e) {
            Log::error("getSalesDetailed Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Kept for backward compatibility
    public function getDetailedSales(Request $request) { return $this->getSalesDetailed($request); }
    public function getSummaryReport(Request $request) { return $this->getSalesSummary($request); }
}