<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportFilterRequest;
use App\Repositories\ReportRepositoryInterface;
use App\Actions\Reports\ExportSalesCsvAction;
use App\Actions\Reports\ExportItemsCsvAction;
use App\Http\Resources\ReportSummaryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected ReportRepositoryInterface $reportRepo;
    protected ExportSalesCsvAction $exportSalesAction;
    protected ExportItemsCsvAction $exportItemsAction;

    public function __construct(
        ReportRepositoryInterface $reportRepo,
        ExportSalesCsvAction $exportSalesAction,
        ExportItemsCsvAction $exportItemsAction
    ) {
        $this->reportRepo = $reportRepo;
        $this->exportSalesAction = $exportSalesAction;
        $this->exportItemsAction = $exportItemsAction;
    }

    public function getFoodMenu()
    {
        try {
            $menu = $this->reportRepo->getFoodMenu();
            return response()->json($menu->values());
        } catch (\Exception $e) {
            Log::error("Food Menu Report Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch menu items'], 500);
        }
    }

    public function getSalesReport(ReportFilterRequest $request)
    {
        try {
            $from     = $request->query('from', date('Y-m-d')) . ' 00:00:00';
            $to       = $request->query('to',   date('Y-m-d')) . ' 23:59:59';
            $type     = $request->query('type', 'SALES');
            $branchId = $request->resolveBranchId();

            $data = $this->reportRepo->getSalesReport($from, $to, $type, $branchId);

            return response()->json($data->values());
        } catch (\Exception $e) {
            Log::error("Sales Aggregator Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error: Check Laravel Logs'], 500);
        }
    }

    public function getItemQuantities(ReportFilterRequest $request)
    {
        $date        = $request->query('date', date('Y-m-d'));
        $branchId    = $request->resolveBranchId();
        $user        = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        try {
            $data = $this->reportRepo->getItemQuantities($date, $branchId, $cashierName);
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error("Item Quantities Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch item quantities'], 500);
        }
    }

    public function getHourlySales(ReportFilterRequest $request)
    {
        $date        = $request->query('date', date('Y-m-d'));
        $branchId    = $request->resolveBranchId();
        $user        = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        try {
            $hourlyData = $this->reportRepo->getHourlySales($date, $branchId);
            return response()->json([
                'hourly_data' => $hourlyData,
                'prepared_by' => $cashierName,
            ]);
        } catch (\Exception $e) {
            Log::error("Hourly Sales Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch hourly sales'], 500);
        }
    }

    public function getCashCountSummary(ReportFilterRequest $request)
    {
        $date     = $request->query('date', now()->toDateString());
        $branchId = $request->resolveBranchId();
        $user     = auth('sanctum')->user() ?? $request->user();
        $cashier  = $user ? $user->name : 'System Admin';

        try {
            $data = $this->reportRepo->getCashCountSummary($date, $branchId, $cashier);
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('CashCount summary error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function getVoidLogs(ReportFilterRequest $request)
    {
        try {
            $date     = $request->query('date', now()->toDateString());
            $branchId = $request->resolveBranchId();
            $user     = auth('sanctum')->user() ?? $request->user();

            $voids = $this->reportRepo->getVoidLogs($date, $branchId);

            return response()->json([
                'logs'        => $voids,
                'prepared_by' => $user->name ?? 'System Admin',
            ]);
        } catch (\Exception $e) {
            Log::error("Void Logs Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error', 'message' => $e->getMessage()], 500);
        }
    }

    public function exportSales(ReportFilterRequest $request)
    {
        $period   = $request->query('period');
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');
        $branchId = $request->resolveBranchId();

        if ($period && in_array($period, ['daily', 'weekly', 'monthly'])) {
            $anchor = Carbon::today();
            [$startDate, $endDate] = match ($period) {
                'daily'   => [$anchor->copy()->startOfDay(),   $anchor->copy()->endOfDay()],
                'weekly'  => [$anchor->copy()->startOfWeek(),  $anchor->copy()->endOfWeek()],
                'monthly' => [$anchor->copy()->startOfMonth(), $anchor->copy()->endOfMonth()],
            };
        } elseif ($dateFrom && $dateTo) {
            $startDate = Carbon::parse($dateFrom)->startOfDay();
            $endDate   = Carbon::parse($dateTo)->endOfDay();
        } else {
            $startDate = Carbon::today()->startOfDay();
            $endDate   = Carbon::today()->endOfDay();
            $period    = 'daily';
        }

        try {
            $data = $this->reportRepo->getExportSalesData($startDate, $endDate, $branchId);
            return $this->exportSalesAction->execute(
                $startDate->toDateString(), 
                $endDate->toDateString(), 
                $branchId, 
                $period, 
                $data
            );
        } catch (\Exception $e) {
            Log::error("Sales Export Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to export sales report'], 500);
        }
    }

    public function exportItems(ReportFilterRequest $request)
    {
        $date     = $request->query('date', now()->toDateString());
        $branchId = $request->resolveBranchId();

        try {
            $items = $this->reportRepo->getExportItemsData($date, $branchId);
            return $this->exportItemsAction->execute($date, $items);
        } catch (\Exception $e) {
            Log::error("Items Export Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to export items data'], 500);
        }
    }

    public function getSalesSummary(ReportFilterRequest $request)
    {
        try {
            $from     = $request->query('from', now()->toDateString()) . ' 00:00:00';
            $to       = $request->query('to',   now()->toDateString()) . ' 23:59:59';
            $branchId = $request->resolveBranchId();

            $data = $this->reportRepo->getSalesSummary($from, $to, $branchId);

            return response()->json(new ReportSummaryResource($data));
        } catch (\Exception $e) {
            Log::error("getSalesSummary Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate summary report'], 500);
        }
    }

    public function getSalesDetailed(ReportFilterRequest $request)
    {
        try {
            $date     = $request->query('date', now()->toDateString());
            $branchId = $request->resolveBranchId();
            
            // This mirrors getGeneralSalesData / getDetailedData fallback logic
            $from     = $date . ' 00:00:00';
            $to       = $date . ' 23:59:59';
            
            $transactions = $this->reportRepo->getSalesReport($from, $to, 'DETAILED', $branchId);

            return response()->json([
                'search_results' => $transactions,
                'transactions'   => $transactions
            ]);
        } catch (\Exception $e) {
            Log::error("getSalesDetailed Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to generate detailed report'], 500);
        }
    }
}