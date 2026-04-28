<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\SalesDashboardService;
use App\Http\Resources\SalesAnalyticsResource;
use App\Models\ZReading;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

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

            $data = $this->salesService->getAnalyticsData($branchId);
            
            return response()->json(new SalesAnalyticsResource($data));
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

        $report = $this->salesService->getItemReport($from, $to, $type, $branchId);

        return response()->json([
            'items'        => $report['items'],
            'total_qty'    => $report['total_qty'],
            'grand_total'  => round((float) $report['grand_total'], 2),
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

            $shift  = $request->query('shift');
            $report = $this->salesService->getXReading($request->date, null, $branchId, $shift);
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
            $branchId = $request->input('branch_id')
                ? (int) $request->input('branch_id')
                : $user?->branch_id;
            $shift = $request->input('shift');

            $report                = $this->salesService->generateZReading($from, $to, $branchId, $shift);
            $report['prepared_by'] = $user?->name ?? 'System Admin';

            $zRecord = ZReading::where('reading_date', $from)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->first();

            $branch = Branch::find($branchId);

            return response()->json([
                'success' => true,
                'data'    => array_merge($report, [
                    'branch_id'         => $branchId,
                    'branch_name'       => $branch?->name ?? "Branch #{$branchId}",
                    'date'              => $from,
                    'discount'          => $report['total_discounts'],
                    'cash'              => $report['cash_total'],
                    'gcash'             => collect($report['payment_breakdown'])->where('method', 'gcash')->sum('amount'),
                    'card'              => collect($report['payment_breakdown'])->whereIn('method', ['visa', 'mastercard'])->sum('amount'),
                    'returns'           => $report['total_void_amount'],
                    'total_orders'      => $report['transaction_count'],
                    'is_closed'         => (bool) ($zRecord?->is_closed ?? false),
                    'closed_at'         => $zRecord?->closed_at,
                    'net_total'         => $report['net_total'] ?? 0,
                    'rounding_adjustment' => $report['rounding_adjustment'] ?? 0,
                    'cashier_breakdown' => [],
                ]),
            ]);
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

            $data = $this->salesService->getDashboardData($branchId);

            return response()->json([
                'success' => true,
                'data'    => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard Data Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to load dashboard data.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/reports/z-reading/history
     */
    public function zReadingHistory(Request $request): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;

            $history = $this->salesService->getZReadingHistory($branchId);

            return response()->json([
                'success' => true,
                'data'    => $history,
            ]);
        } catch (\Exception $e) {
            Log::error('Z-Reading History Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error loading Z-Reading history'], 500);
        }
    }

    /**
     * POST /api/readings/z/close
     */
    public function zReadingClose(Request $request): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $user?->branch_id;
            $date     = $request->input('date', now()->toDateString());

            ZReading::where('reading_date', $date)
                ->where('branch_id', $branchId)
                ->update([
                    'is_closed' => true,
                    'closed_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Z-Reading closed successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Z-Reading Close Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error closing Z-Reading'], 500);
        }
    }

    /**
     * POST /api/readings/z/print-token
     */
    public function zReadingPrintToken(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'token'   => Str::random(32),
            'expires' => now()->addMinutes(10)->toDateTimeString(),
        ]);
    }

    /**
     * GET /api/reports/z-reading/status
     */
    public function zReadingStatus(Request $request): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $request->input('branch_id') ? (int) $request->input('branch_id') : $user?->branch_id;
            $date     = $request->input('date', now()->toDateString());

            $status = $this->salesService->checkZReadingStatus($date, $branchId);

            return response()->json([
                'success' => true,
                'data'    => $status,
            ]);
        } catch (\Exception $e) {
            Log::error('Z-Reading Status Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error checking Z-Reading status'], 500);
        }
    }

    /**
     * GET /api/reports/z-reading/gaps
     */
    public function zReadingGaps(Request $request): JsonResponse
    {
        try {
            $user     = auth('sanctum')->user() ?? $request->user();
            $branchId = $request->input('branch_id') ? (int) $request->input('branch_id') : $user?->branch_id;
            $days     = $request->input('days', 30);

            $gaps = $this->salesService->getZReadingGaps($branchId, $days);

            return response()->json([
                'success' => true,
                'data'    => $gaps,
            ]);
        } catch (\Exception $e) {
            Log::error('Z-Reading Gaps Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error checking Z-Reading gaps'], 500);
        }
    }
}