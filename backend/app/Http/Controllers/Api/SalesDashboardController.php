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
    public function index(): JsonResponse
    {
        try {
            return response()->json($this->salesService->getAnalyticsData());
        } catch (\Exception $e) {
            Log::error('Sales Analytics Error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load sales analytics.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/reports/items-report?from=&to=
     */
    public function itemsReport(Request $request): JsonResponse
    {
        $from     = $request->query('from');
        $to       = $request->query('to');
        $user     = auth('sanctum')->user() ?? $request->user();
        $branchId = $user?->branch_id;

        $items = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->where('sales.status', '!=', 'cancelled')
            ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
            ->select(
                'sale_items.product_name as name',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.final_price) as amount')
            )
            ->groupBy('sale_items.product_name')
            ->get();

        return response()->json([
            'items'        => $items,
            'total_qty'    => $items->sum('qty'),
            'grand_total'  => $items->sum('amount'),
            'cashier_name' => $user?->name ?? 'System Admin',
        ]);
    }

    /**
     * GET /api/reports/x-reading?date=
     * Single-day report for the authenticated user's branch.
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
     * Date-range report, branch-filtered — same logic as X-Reading.
     */
    public function zReading(Request $request): JsonResponse
    {
        // Accept either ?date= (single day) or ?from=&to= (range)
        $from = $request->input('from', $request->input('date'));
        $to   = $request->input('to',   $request->input('date'));

        $request->merge(['from' => $from, 'to' => $to]);
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;  // ← same branch filter as xReading

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
    public function dashboardData(): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user();
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

            $todayTotal     = (float) \App\Models\Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('total_amount');
            $cancelledTotal = (float) \App\Models\Sale::whereDate('created_at', $today)->where('status', 'cancelled')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('total_amount');

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
}