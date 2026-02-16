<?php

namespace App\Http\Controllers\Api;

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
            \Log::error("Sales Analytics Error: " . $e->getMessage());
            
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
}