<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;

class SalesDashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get weekly sales data for line chart
     */
    public function getWeeklySales()
    {
        try {
            $data = $this->dashboardService->getWeeklySalesData();
            
            return response()->json([
                'success' => true,
                'data' => $data
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch weekly sales data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's hourly sales data for bar chart
     */
    public function getTodaySales()
    {
        try {
            $data = $this->dashboardService->getTodayHourlySales();
            
            return response()->json([
                'success' => true,
                'data' => $data
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch today\'s sales data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales statistics (beginning, ending, cancelled, OR numbers)
     */
    public function getSalesStatistics()
    {
        try {
            $data = $this->dashboardService->getSalesStatistics();
            
            return response()->json([
                'success' => true,
                'data' => $data
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all dashboard data in one request
     */
    public function getDashboardData()
    {
        try {
            $weeklySales = $this->dashboardService->getWeeklySalesData();
            $todaySales = $this->dashboardService->getTodayHourlySales();
            $statistics = $this->dashboardService->getSalesStatistics();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'weekly_sales' => $weeklySales,
                    'today_sales' => $todaySales,
                    'statistics' => $statistics
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}