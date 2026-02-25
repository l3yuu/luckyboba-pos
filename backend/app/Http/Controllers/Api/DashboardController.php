<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(): JsonResponse
    {
        // Every time this is called, it uses the Service logic
        // If clearTodayCache() was called by SalesController, this will fetch fresh data
        $stats = $this->dashboardService->getHomeStats();
        
        return response()->json($stats);
    }

    public function init(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
            'stats' => $this->dashboardService->getHomeStats(),
        ]);
    }
}