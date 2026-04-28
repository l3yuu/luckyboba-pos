<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SuperAdminReportController extends Controller
{
    // ─────────────────────────────────────────
    //  SALES SUMMARY
    // ─────────────────────────────────────────

    public function salesSummary(Request $request)
    {
        $request->validate([
            'period'     => 'required|in:daily,weekly,monthly',
            'branch_id'  => 'nullable|exists:branches,id',
            'date'       => 'nullable|date',
            'shift'      => 'nullable|in:1,2',
        ]);

        $period   = $request->period;
        $branchId = $request->branch_id;
        $shift    = $request->query('shift');

        // Use provided date, or fall back to the most recent date that has sales data
        $anchor = $request->date ? Carbon::parse($request->date) : Carbon::today();

        [$startDate, $endDate] = $this->resolveDateRange($period, $anchor);

        $applyShift = function ($query, $table = 'sales') use ($shift) {
            if ($shift) {
                $query->where("{$table}.shift", $shift);
            }
        };

        $baseQuery = DB::table('sales')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($branchId) {
            $baseQuery->where('branch_id', $branchId);
        }
        $applyShift($baseQuery, 'sales');

        $revenuePerBranch = DB::table('sales')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->select(
                'branches.id   as branch_id',
                'branches.name as branch_name',
                DB::raw('SUM(sales.total_amount)  as total_revenue'),
                DB::raw('COUNT(sales.id)           as order_count'),
                DB::raw('AVG(sales.total_amount)   as average_order_value')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->when($shift, fn($q) => $q->where('sales.shift', $shift))
            ->groupBy('branches.id', 'branches.name')
            ->orderByDesc('total_revenue')
            ->get();

        $breakdown = DB::table('sales')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(id)         as orders'),
                DB::raw('AVG(total_amount) as avg_order_value')
            )
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($shift, fn($q) => $q->where('shift', $shift))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity)               as total_quantity'),
                DB::raw('SUM(sale_items.final_price)            as total_revenue'),
                DB::raw('AVG(sale_items.price)                  as avg_unit_price'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id)     as times_ordered')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->when($shift, fn($q) => $q->where('sales.shift', $shift))
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        $totals = (clone $baseQuery)->select(
            DB::raw('SUM(total_amount) as grand_total'),
            DB::raw('COUNT(id)         as total_orders'),
            DB::raw('AVG(total_amount) as avg_order_value'),
            DB::raw('0                 as total_customers')  // ← was SUM(pax)
        )->first();

        return response()->json([
            'meta' => [
                'period'     => $period,
                'start_date' => $startDate->toDateString(),
                'end_date'   => $endDate->toDateString(),
                'branch_id'  => $branchId,
                'shift'      => $shift,
            ],
            'totals'             => $totals,
            'revenue_per_branch' => $revenuePerBranch,
            'breakdown'          => $breakdown,
            'top_products'       => $topProducts,
        ]);
    }

    // ─────────────────────────────────────────
    //  BRANCH COMPARISON
    // ─────────────────────────────────────────

    public function branchComparison(Request $request)
    {
        $request->validate([
            'period' => 'required|in:daily,weekly,monthly',
            'date'   => 'nullable|date',
            'shift'  => 'nullable|in:1,2',
        ]);

        $period = $request->period;
        $shift  = $request->query('shift');

        // Use provided date, or fall back to the most recent date that has sales data
        $anchor = $request->date ? Carbon::parse($request->date) : Carbon::today();

        [$startDate, $endDate] = $this->resolveDateRange($period, $anchor);

        $branches = DB::table('branches')->get(['id', 'name']);

        $metrics = DB::table('sales')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->select(
                'branches.id            as branch_id',
                'branches.name          as branch_name',
                DB::raw("'' as location"),
                DB::raw('SUM(sales.total_amount)   as total_revenue'),
                DB::raw('COUNT(sales.id)            as total_orders'),
                DB::raw('AVG(sales.total_amount)    as avg_order_value'),
                DB::raw('0                          as total_customers'),
                DB::raw('0                          as avg_pax_per_order')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($shift, fn($q) => $q->where('sales.shift', $shift))
            ->groupBy('branches.id', 'branches.name')
            ->orderByDesc('total_revenue')
            ->get();

        $topProductPerBranch = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select(
                'sales.branch_id',
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($shift, fn($q) => $q->where('sales.shift', $shift))
            ->groupBy('sales.branch_id', 'sale_items.product_name')
            ->orderBy('sales.branch_id')
            ->orderByDesc('total_qty')
            ->get()
            ->groupBy('branch_id')
            ->map(fn($items) => $items->first());

        $paymentBreakdown = DB::table('sales')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->select(
                'sales.branch_id',
                'branches.name as branch_name',
                'sales.payment_method',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as revenue')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->when($shift, fn($q) => $q->where('sales.shift', $shift))
            ->groupBy('sales.branch_id', 'branches.name', 'sales.payment_method')
            ->get()
            ->groupBy('branch_id');

        $comparison = $metrics->map(function ($branch) use ($topProductPerBranch, $paymentBreakdown) {
            $branch->top_product     = $topProductPerBranch->get($branch->branch_id);
            $branch->payment_methods = $paymentBreakdown->get($branch->branch_id, collect());
            return $branch;
        });

        $ranked = $comparison->values()->map(function ($branch, $index) {
            $branch->revenue_rank = $index + 1;
            return $branch;
        });

        return response()->json([
            'meta' => [
                'period'     => $period,
                'start_date' => $startDate->toDateString(),
                'end_date'   => $endDate->toDateString(),
                'shift'      => $shift,
            ],
            'branches'   => $branches,
            'comparison' => $ranked,
        ]);
    }

    // ─────────────────────────────────────────
    //  HELPER
    // ─────────────────────────────────────────

    private function resolveDateRange(string $period, Carbon $anchor): array
    {
        return match ($period) {
            'daily'   => [
                $anchor->copy()->startOfDay(),
                $anchor->copy()->endOfDay(),
            ],
            'weekly'  => [
                $anchor->copy()->startOfWeek(),
                $anchor->copy()->endOfWeek(),
            ],
            'monthly' => [
                $anchor->copy()->startOfMonth(),
                $anchor->copy()->endOfMonth(),
            ],
        };
    }

    public function itemsReport(Request $request)
    {
        $from     = $request->query('date_from', today()->toDateString());
        $to       = $request->query('date_to',   today()->toDateString());
        $branchId = $request->query('branch_id');
        $shift    = $request->query('shift');

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select(
                'sale_items.product_name',
                'sale_items.size',
                'sale_items.cup_size_label',
                DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                DB::raw('SUM(sale_items.quantity)           as total_quantity'),
                DB::raw('SUM(sale_items.final_price * sale_items.quantity) as total_revenue'),
                DB::raw('AVG(sale_items.price)              as avg_unit_price'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id) as times_ordered')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [
                $from . ' 00:00:00',
                $to   . ' 23:59:59',
            ])
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->when($shift, fn($q) => $q->where('sales.shift', $shift))
            ->groupBy('sale_items.product_name', 'sale_items.size', 'sale_items.cup_size_label', 'categories.name')
            ->orderByDesc('total_quantity')
            ->get();                          // ← no limit, returns everything

        return response()->json([
            'top_products' => $topProducts,
            'meta' => [
                'date_from' => $from,
                'date_to'   => $to,
                'branch_id' => $branchId,
                'shift'     => $shift,
            ],
        ]);
    }

    public function exportItems(Request $request)
    {
        $from     = $request->query('date_from', today()->toDateString());
        $to       = $request->query('date_to',   today()->toDateString());
        $branchId = $request->query('branch_id');

        $branchName = $branchId
            ? DB::table('branches')->where('id', $branchId)->value('name') ?? 'Unknown Branch'
            : 'All Branches';

        $items = DB::table('sale_items')          // ← renamed from $baseQuery to $items
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('branches', 'sales.branch_id', '=', 'branches.id')
            ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select(
                'branches.id   as branch_id',
                'branches.name as branch_name',
                'sale_items.product_name',
                'sale_items.size',
                'sale_items.cup_size_label',
                DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.final_price * sale_items.quantity) as total_revenue'),
                DB::raw('AVG(sale_items.price) as avg_unit_price'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id) as times_ordered')
            )
            ->where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [
                $from . ' 00:00:00',
                $to   . ' 23:59:59',
            ])
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->groupBy('branches.id', 'branches.name', 'sale_items.product_name', 'sale_items.size', 'sale_items.cup_size_label', 'categories.name')
            ->orderBy('branches.name')
            ->orderByDesc('total_quantity')
            ->get();

        $generatedAt  = now()->format('F d, Y h:i A');
        $grandQty     = $items->sum('total_quantity');    // ← now valid
        $grandRevenue = $items->sum('total_revenue');     // ← now valid

        // ── Report Header ──────────────────────────────────────────
        $csv  = "LUCKY BOBA POS - ITEMS SALES REPORT\n";
        $csv .= "Generated:,\"" . $generatedAt . "\"\n";
        $csv .= "Date Range:,\"" . date('F d Y', strtotime($from)) . " to " . date('F d Y', strtotime($to)) . "\"\n";
        $csv .= "Branch:,\"" . $branchName . "\"\n";
        $csv .= "\n";

        if ($branchId) {
            $totalQty     = $items->sum('total_quantity');
            $totalRevenue = $items->sum('total_revenue');
            $totalOrders  = $items->sum('times_ordered');
            $topItem      = $items->first();

            $csv .= "SUMMARY\n";
            $csv .= "Total Qty Sold:," . (int) $totalQty . "\n";
            $csv .= "Total Revenue (PHP):,\"" . number_format($totalRevenue, 2) . "\"\n";
            $csv .= "Total Orders:," . (int) $totalOrders . "\n";
            if ($topItem) {
                $csv .= "Top Selling Item:,\"" . $topItem->product_name . " (" . (int) $topItem->total_quantity . " sold)\"\n";
            }
            $csv .= "\n";

            $csv .= $this->buildItemsTable($items, $totalRevenue);

        } else {
            $grouped = $items->groupBy('branch_id');    // ← groupBy on the collection

            $csv .= "GRAND SUMMARY\n";
            $csv .= "Total Branches:," . $grouped->count() . "\n";
            $csv .= "Total Qty Sold (All):," . (int) $grandQty . "\n";
            $csv .= "Total Revenue (All) (PHP):,\"" . number_format($grandRevenue, 2) . "\"\n";
            $csv .= "\n";

            foreach ($grouped as $branchItems) {
                $bName    = $branchItems->first()->branch_name ?? 'Unknown Branch';
                $bQty     = $branchItems->sum('total_quantity');
                $bRevenue = $branchItems->sum('total_revenue');
                $bOrders  = $branchItems->sum('times_ordered');
                $bTop     = $branchItems->first();
                $bShare   = $grandRevenue > 0
                    ? round(($bRevenue / $grandRevenue) * 100, 1)
                    : 0;

                $csv .= "══════════════════════════════════════════════════════════\n";
                $csv .= "BRANCH:,\"" . strtoupper($bName) . "\"\n";
                $csv .= "══════════════════════════════════════════════════════════\n";
                $csv .= "Qty Sold:," . (int) $bQty . "\n";
                $csv .= "Revenue (PHP):,\"" . number_format($bRevenue, 2) . "\"\n";
                $csv .= "Orders:," . (int) $bOrders . "\n";
                $csv .= "Revenue Share (vs all branches):," . $bShare . "%\n";
                if ($bTop) {
                    $csv .= "Top Item:,\"" . $bTop->product_name . " (" . (int) $bTop->total_quantity . " sold)\"\n";
                }
                $csv .= "\n";

                $csv .= $this->buildItemsTable($branchItems, $bRevenue);
                $csv .= "\n";
            }

            $csv .= "══════════════════════════════════════════════════════════\n";
            $csv .= "GRAND TOTALS,,," . (int) $grandQty . ",\"" . number_format($grandRevenue, 2) . "\",,,100%\n";
            $csv .= "══════════════════════════════════════════════════════════\n";
        }

        $csv .= "\n--- End of Report ---\n";

        $branchSlug = $branchId
            ? strtoupper(preg_replace('/[^a-zA-Z0-9]+/', '-', $branchName))
            : 'ALL-BRANCHES';

        $filename = "LuckyBoba_ItemsReport_{$branchSlug}_{$from}_to_{$to}.csv";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ── Reusable table builder ─────────────────────────────────────────────────────
    private function buildItemsTable($items, float $totalRevenue): string
    {
        $csv  = "#,Item Name,Size,Category,Qty Sold,Total Revenue (PHP),Avg Price (PHP),Times Ordered,Revenue Share\n";

        $rank = 1;
        foreach ($items as $item) {
            $revShare = $totalRevenue > 0
                ? round(($item->total_revenue / $totalRevenue) * 100, 1) . '%'
                : '0%';

            $size = $item->cup_size_label ?: ($item->size ?: '—');
            $csv .= implode(',', [
                $rank++,
                '"' . str_replace('"', '""', $item->product_name) . '"',
                '"' . str_replace('"', '""', $size) . '"',
                '"' . str_replace('"', '""', $item->category) . '"',
                (int) $item->total_quantity,
                '"' . number_format((float) $item->total_revenue, 2) . '"',
                '"' . number_format((float) $item->avg_unit_price, 2) . '"',
                (int) $item->times_ordered,
                $revShare,
            ]) . "\n";
        }

        // Subtotal row
        $subtotalQty = $items->sum('total_quantity');
        $subtotalRev = $items->sum('total_revenue');
        $csv .= "SUBTOTAL,,," . (int) $subtotalQty . ",\"" . number_format((float) $subtotalRev, 2) . "\",,,100%\n";

        return $csv;
    }
}