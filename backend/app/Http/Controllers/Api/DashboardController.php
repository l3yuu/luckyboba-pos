<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    protected $dashboardService;

    // Inject the service here
    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(): JsonResponse
    {
        // Fix: Change getDailyStats() to getHomeStats()
        $stats = $this->dashboardService->getHomeStats();
        
        return response()->json($stats);
    }
}
