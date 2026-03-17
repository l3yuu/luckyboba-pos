<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\SalesDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesDashboardController extends Controller
{
    protected $salesService;

    public function __construct(SalesDashboardService $salesService)
    {
        $this->salesService = $salesService;
    }

    /**
     * GET /api/sales-analytics
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            return response()->json(
                $this->salesService->getAnalyticsData($branchId)
            );
        } catch (\Exception $e) {
            Log::error('Sales Analytics Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to load sales analytics.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/reports/items-report?from=&to=&type=
     */
    public function itemsReport(Request $request): JsonResponse
    {
        $from     = $request->query('from');
        $to       = $request->query('to');
        $type     = $request->query('type', 'item-list');
        $user     = auth('sanctum')->user() ?? $request->user();
        $branchId = $user?->branch_id;

        // Subquery to get the total final_price per sale (used for proration)
        $saleSubtotalSql = '(SELECT SUM(si2.final_price * si2.quantity) FROM sale_items si2 WHERE si2.sale_id = sales.id)';

        // Prorated amount = item_subtotal * (actual_paid / sale_subtotal)
        // This ensures items report always matches gross sales even when discounts exist
        $proratedAmount = "SUM(
            sale_items.final_price * sale_items.quantity
            * (sales.total_amount / NULLIF({$saleSubtotalSql}, 0))
        )";

        if ($type === 'category-summary') {
            $items = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
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
        } else {
            $items = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
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

        return response()->json([
            'items'        => $items,
            'total_qty'    => $items->sum('qty'),
            'grand_total'  => round((float) $items->sum('amount'), 2),
            'cashier_name' => $user?->name ?? 'System Admin',
        ]);
    }

    /**
     * GET /api/reports/x-reading?date=
     */
    public function xReading(Request $request): JsonResponse
    {
        $request->validate(['date' => 'required|date']);

        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $report                = $this->salesService->getXReading($request->date, null, $branchId);
            $report['prepared_by'] = $user?->name ?? 'System Admin';

            return response()->json($report);
        } catch (\Exception $e) {
            Log::error('X-Reading Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error generating X-Reading'], 500);
        }
    }

    /**
     * GET /api/reports/z-reading?from=&to=   (or ?date= for single-day)
     */
    public function zReading(Request $request): JsonResponse
    {
        $from = $request->input('from', $request->input('date'));
        $to   = $request->input('to',   $request->input('date'));

        $request->merge(['from' => $from, 'to' => $to]);
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $report                = $this->salesService->generateZReading($from, $to, $branchId);
            $report['prepared_by'] = $user?->name ?? 'System Admin';

            return response()->json($report);
        } catch (\Exception $e) {
            Log::error('Z-Reading Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error generating Z-Reading'], 500);
        }
    }

    /**
     * GET /api/reports/mall-accreditation?date=&mall=
     */
    public function mallReport(Request $request): JsonResponse
    {
        $request->validate(['date' => 'required|date', 'mall' => 'required|string']);

        $user     = auth('sanctum')->user() ?? $request->user();
        $branchId = $user?->branch_id;

        $report = $this->salesService->getMallReport($request->date, $request->mall, $branchId);

        return response()->json($report);
    }

    /**
     * GET /api/reports/dashboard-data
     */
    public function dashboardData(Request $request): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $today     = now()->toDateString();
            $weekStart = now()->startOfWeek()->toDateString();
            $weekEnd   = now()->endOfWeek()->toDateString();

            $weeklySales = \App\Models\Sale::selectRaw('DATE(created_at) as date, SUM(total_amount) as value')
                ->whereBetween('created_at', [$weekStart . ' 00:00:00', $weekEnd . ' 23:59:59'])
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->map(fn($row) => [
                    'day'       => \Carbon\Carbon::parse($row->date)->format('D'),
                    'date'      => \Carbon\Carbon::parse($row->date)->format('M d'),
                    'value'     => (float) $row->value,
                    'full_date' => $row->date,
                ]);

            $todaySales = \App\Models\Sale::selectRaw('HOUR(created_at) as hour, SUM(total_amount) as value')
                ->whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupByRaw('HOUR(created_at)')
                ->orderBy('hour')
                ->get()
                ->map(fn($row) => [
                    'time'  => \Carbon\Carbon::createFromTime($row->hour)->format('g A'),
                    'value' => (float) $row->value,
                ]);

            $beginning = \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->orderBy('id')->first();

            $ending = \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->orderBy('id', 'desc')->first();

            $todayTotal = (float) \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_amount');

            $cancelledTotal = (float) \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_amount');

            return response()->json([
                'success' => true,
                'data'    => [
                    'weekly_sales' => [
                        'data'               => $weeklySales,
                        'total_revenue'      => $weeklySales->sum('value'),
                        'start_date'         => \Carbon\Carbon::parse($weekStart)->format('M d, Y'),
                        'end_date'           => \Carbon\Carbon::parse($weekEnd)->format('M d, Y'),
                        'current_week_start' => $weekStart,
                    ],
                    'today_sales' => [
                        'data' => $todaySales,
                        'date' => $today,
                    ],
                    'statistics' => [
                        'beginning_sales' => 0,
                        'today_sales'     => $todayTotal,
                        'ending_sales'    => $todayTotal,
                        'cancelled_sales' => $cancelledTotal,
                        'beginning_or'    => $beginning?->invoice_number ?? '00000',
                        'ending_or'       => $ending?->invoice_number    ?? '00000',
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard Data Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/reports/z-reading-history
     */
    public function zReadingHistory(Request $request)
    {
        try {
            $branchId = $request->branch_id;

            $history = DB::table('cash_counts')
                ->join('branches', 'cash_counts.branch_id', '=', 'branches.id')
                ->leftJoin('users', 'cash_counts.user_id', '=', 'users.id')
                ->select(
                    'cash_counts.id',
                    'cash_counts.date',
                    'branches.name as branch_name',
                    'cash_counts.created_at as closed_at',
                    'users.name as cashier_name',
                    'cash_counts.branch_id'
                )
                ->when($branchId, fn($q) => $q->where('cash_counts.branch_id', $branchId))
                ->orderByDesc('cash_counts.date')
                ->limit(50)
                ->get()
                ->map(function ($row) {
                    $date = $row->date;
                    $sales = DB::table('sales')
                        ->whereDate('created_at', $date)
                        ->where('branch_id', $row->branch_id)
                        ->where('status', '!=', 'cancelled')
                        ->selectRaw('SUM(total_amount) as gross, COUNT(*) as total_orders')
                        ->first();

                    $row->gross        = (float) ($sales->gross        ?? 0);
                    $row->net          = (float) ($sales->gross        ?? 0);
                    $row->total_orders = (int)   ($sales->total_orders ?? 0);
                    unset($row->branch_id);
                    return $row;
                });

            return response()->json(['success' => true, 'data' => $history]);

        } catch (\Exception $e) {
            Log::error('Z Reading History Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}