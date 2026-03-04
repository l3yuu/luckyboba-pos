<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ItemsReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ItemsReportController extends Controller
{
    protected ItemsReportService $itemsReportService;

    public function __construct(ItemsReportService $itemsReportService)
    {
        $this->itemsReportService = $itemsReportService;
    }

    /**
     * Get items sold report for a specific date range
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getItemsSoldReport(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date',
                'filter' => 'nullable|string',
                'report_type' => 'nullable|string|in:category-summary,item-list,category-per-item,per-hour'
            ]);

            $fromDate = $validated['from_date'];
            $toDate = $validated['to_date'];
            $filter = $validated['filter'] ?? 'all';
            $reportType = $validated['report_type'] ?? 'item-list';

            // Get the report data based on report type
            $reportData = match($reportType) {
                'category-summary' => $this->itemsReportService->getCategorySummary($fromDate, $toDate, $filter),
                'item-list' => $this->itemsReportService->getItemsList($fromDate, $toDate, $filter),
                'category-per-item' => $this->itemsReportService->getCategoryPerItem($fromDate, $toDate, $filter),
                'per-hour' => $this->itemsReportService->getPerHourReport($fromDate, $toDate, $filter),
                default => $this->itemsReportService->getItemsList($fromDate, $toDate, $filter)
            };

            return response()->json([
                'success' => true,
                'data' => $reportData,
                'period' => [
                    'from' => $fromDate,
                    'to' => $toDate
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get items sold for a specific day (quick endpoint)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getItemsSoldToday(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date', now()->toDateString());
            
            $reportData = $this->itemsReportService->getItemsList($date, $date, 'all');

            return response()->json([
                'success' => true,
                'data' => $reportData,
                'date' => $date
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching items sold: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test endpoint to verify setup
     * 
     * @return JsonResponse
     */
    public function test(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Items Report API is working!',
            'timestamp' => now()->toDateTimeString()
        ], 200);
    }
}