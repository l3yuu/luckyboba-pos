<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\SalesDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesDashboardController extends Controller
{
    protected $salesService;

    /**
     * Inject the specialized SalesDashboardService
     */
    public function __construct(SalesDashboardService $salesService)
    {
        $this->salesService = $salesService;
    }

    /**
     * GET /api/sales-analytics
     * Fetch line graph (weekly) and bar graph (hourly) data
     */
    public function index(): JsonResponse
    {
        try {
            // Fetch aggregated chart data from the service
            $analytics = $this->salesService->getAnalyticsData();
            
            return response()->json($analytics);
        } catch (\Exception $e) {
            // Log the error for OJT debugging
            Log::error("Sales Analytics Error: " . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to load sales analytics.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function itemsReport(Request $request)
    {
        // Validate that 'type' is one of our supported options
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date',
            'type' => 'nullable|string|in:item-list,category-summary'
        ]);

        $report = $this->salesService->getItemReport(
            $request->from, 
            $request->to, 
            $request->type ?? 'item-list'
        );

        return response()->json($report);
    }

public function xReading(Request $request)
    {
        $request->validate(['date' => 'required|date']);

        try {
            $report = $this->salesService->getXReading($request->date);
            return response()->json($report);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error generating X-Reading'], 500);
        }
    }

    public function zReading(Request $request) 
    {
        $request->validate(['date' => 'required|date']);

        try {
            $report = $this->salesService->generateZReading($request->date);

            // CHANGE: Use array syntax $report['key'] instead of object syntax $report->key
            return response()->json([
                'reading_date'      => $report['reading_date'] ?? $request->date,
                'gross_sales'       => (float)($report['gross_sales'] ?? 0),
                'net_sales'         => (float)($report['net_sales'] ?? 0),
                'transaction_count' => (int)($report['transaction_count'] ?? 0),
                'cash_total'        => (float)($report['cash_total'] ?? 0),
                'non_cash_total'    => (float)($report['non_cash_total'] ?? 0),
                'generated_at'      => $report['generated_at'] ?? now()->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            Log::error("Z-Reading Error: " . $e->getMessage());
            return response()->json(['message' => 'Error generating Z-Reading'], 500);
        }
    }

    public function mallReport(Request $request) 
    {
        $request->validate(['date' => 'required|date', 'mall' => 'required|string']);
        $report = $this->salesService->getMallReport($request->date, $request->mall);
        
        return response()->json($report);
    }

public function dashboardData(): \Illuminate\Http\JsonResponse
{
    try {
        $today = now()->toDateString();
        $weekStart = now()->startOfWeek()->toDateString();
        $weekEnd = now()->endOfWeek()->toDateString();

        // Weekly sales - group by day
        $weeklySales = \App\Models\Sale::selectRaw('DATE(created_at) as date, SUM(total_amount) as value')
            ->whereBetween('created_at', [$weekStart, $weekEnd])
            ->where('status', '!=', 'cancelled')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'day'       => \Carbon\Carbon::parse($row->date)->format('D'),
                'date'      => \Carbon\Carbon::parse($row->date)->format('M d'),
                'value'     => (float) $row->value,
                'full_date' => $row->date,
            ]);

        // Today's sales - group by hour
        $todaySales = \App\Models\Sale::selectRaw('HOUR(created_at) as hour, SUM(total_amount) as value')
            ->whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->groupByRaw('HOUR(created_at)')
            ->orderBy('hour')
            ->get()
            ->map(fn($row) => [
                'time'  => \Carbon\Carbon::createFromTime($row->hour)->format('g A'),
                'value' => (float) $row->value,
            ]);

        // Statistics
        $beginning = \App\Models\Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->orderBy('id')->first();
        $ending    = \App\Models\Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->orderBy('id', 'desc')->first();

        $statistics = [
            'beginning_sales'  => \App\Models\Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->min('total_amount') ?? 0,
            'today_sales'      => \App\Models\Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->sum('total_amount'),
            'ending_sales'     => \App\Models\Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->max('total_amount') ?? 0,
            'cancelled_sales'  => \App\Models\Sale::whereDate('created_at', $today)->where('status', 'cancelled')->sum('total_amount'),
            'beginning_or'     => $beginning?->or_number ?? '00000',
            'ending_or'        => $ending?->or_number ?? '00000',
        ];

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
                'statistics' => $statistics,
            ],
        ]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

public function weeklySales(): JsonResponse
{
    try {
        $startOfWeek = \Carbon\Carbon::now()->startOfWeek();
        return response()->json([
            'success' => true,
            'data' => [
                'current_week_start' => $startOfWeek->format('Y-m-d'),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}


}