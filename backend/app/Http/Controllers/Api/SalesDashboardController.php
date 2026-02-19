<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SalesDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

// SalesDashboardController.php

public function itemsReport(Request $request)
{
    $from = $request->query('from');
    $to = $request->query('to');
    $type = $request->query('type');

    // Example query for 'item-list'
    $items = DB::table('sale_items')
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
        ->select(
            'sale_items.product_name as name',
            DB::raw('SUM(sale_items.quantity) as qty'),
            DB::raw('SUM(sale_items.final_price) as amount')
        )
        ->groupBy('sale_items.product_name')
        ->get();

    return response()->json([
        'items' => $items,
        'total_qty' => $items->sum('qty'),
        'grand_total' => $items->sum('amount')
    ]);
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
            \Log::error("Z-Reading Error: " . $e->getMessage());
            return response()->json(['message' => 'Error generating Z-Reading'], 500);
        }
    }

    public function mallReport(Request $request) 
    {
        $request->validate(['date' => 'required|date', 'mall' => 'required|string']);
        $report = $this->salesService->getMallReport($request->date, $request->mall);
        
        return response()->json($report);
    }
}