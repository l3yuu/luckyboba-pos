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

    public function dashboardData(): JsonResponse
{
    try {
        $data = $this->salesService->getAnalyticsData();
        $startOfWeek = \Carbon\Carbon::now()->startOfWeek();
        $endOfWeek = \Carbon\Carbon::now()->endOfWeek();

        return response()->json([
            'success' => true,
            'data' => [
                'weekly_sales' => [
                    'data' => $data['weekly'],
                    'total_revenue' => $data['stats']['total_revenue'],
                    'start_date' => $startOfWeek->format('M d, Y'),
                    'end_date' => $endOfWeek->format('M d, Y'),
                    'current_week_start' => $startOfWeek->format('Y-m-d'),
                ],
                'today_sales' => [
                    'data' => $data['today_hourly'],
                    'date' => now()->format('Y-m-d'),
                ],
                'statistics' => [
                    'beginning_sales' => 0,
                    'today_sales' => $data['stats']['today_sales'],
                    'ending_sales' => $data['stats']['today_sales'],
                    'cancelled_sales' => $data['stats']['cancelled_sales'],
                    'beginning_or' => $data['stats']['beginning_or'],
                    'ending_or' => $data['stats']['ending_or'],
                ],
            ]
        ]);
    } catch (\Exception $e) {
        Log::error("Dashboard Data Error: " . $e->getMessage());
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