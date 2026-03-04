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
        ]);

        $period   = $request->period;
        $branchId = $request->branch_id;
        $anchor   = $request->date ? Carbon::parse($request->date) : Carbon::today();

        [$startDate, $endDate] = $this->resolveDateRange($period, $anchor);

        $baseQuery = DB::table('sales')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($branchId) {
            $baseQuery->where('branch_id', $branchId);
        }

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
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        $totals = (clone $baseQuery)->select(
            DB::raw('SUM(total_amount) as grand_total'),
            DB::raw('COUNT(id)         as total_orders'),
            DB::raw('AVG(total_amount) as avg_order_value'),
            DB::raw('SUM(pax)          as total_customers')
        )->first();

        return response()->json([
            'meta' => [
                'period'     => $period,
                'start_date' => $startDate->toDateString(),
                'end_date'   => $endDate->toDateString(),
                'branch_id'  => $branchId,
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
        ]);

        $period = $request->period;
        $anchor = $request->date ? Carbon::parse($request->date) : Carbon::today();

        [$startDate, $endDate] = $this->resolveDateRange($period, $anchor);

        $branches = DB::table('branches')
            ->where('status', 'active')
            ->get(['id', 'name', 'location']);

        $metrics = DB::table('sales')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->select(
                'branches.id            as branch_id',
                'branches.name          as branch_name',
                'branches.location',
                DB::raw('SUM(sales.total_amount)   as total_revenue'),
                DB::raw('COUNT(sales.id)            as total_orders'),
                DB::raw('AVG(sales.total_amount)    as avg_order_value'),
                DB::raw('SUM(sales.pax)             as total_customers'),
                DB::raw('AVG(sales.pax)             as avg_pax_per_order')
            )
            ->where('sales.status', 'completed')
            ->where('branches.status', 'active')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->groupBy('branches.id', 'branches.name', 'branches.location')
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
            ->where('branches.status', 'active')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
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
}