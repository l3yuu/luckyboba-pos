<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * Main Sales Aggregator
     * Handles: SUMMARY, SOLD_ITEMS, PAYMENTS, DETAILED, SALES
     */
public function getSalesReport(Request $request)
{
    try {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date',
            'type' => 'required|string'
        ]);

        $from = $request->from . ' 00:00:00';
        $to   = $request->to   . ' 23:59:59';
        $type = $request->type;

        switch ($type) {
            case 'SUMMARY':
                $data = $this->getSummaryData($from, $to);
                break;
            case 'PAYMENTS':
                $data = $this->getPaymentData($from, $to);
                break;
            case 'DETAILED': // ADD THIS CASE
                $data = $this->getDetailedData($from, $to);
                break;
            case 'SALES':
            default:
                $data = $this->getGeneralSalesData($from, $to);
                break;
        }

        return response()->json(array_merge($data, [
            'prepared_by' => auth()->user()->name ?? 'System Admin'
        ]));

    } catch (\Exception $e) {
        Log::error("Report Error: " . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    /* --- PRIVATE DATA FETCHERS (The Engine) --- */

    private function getSummaryData($from, $to)
    {
        $data = Sale::whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw('DATE(created_at) as Sales_Date'),
                DB::raw('COUNT(id) as Total_Orders'),
                DB::raw('SUM(total_amount) as Daily_Revenue')
            )
            ->groupBy('Sales_Date')
            ->orderBy('Sales_Date', 'desc')
            ->get();
            
        return ['summary_data' => $data];
    }

    private function getPaymentData($from, $to)
    {
        $payments = Sale::whereBetween('created_at', [$from, $to])
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'payment_method as Method', 'created_at as Date')
            ->get();
        return ['search_results' => $payments];
    }

    private function getDetailedData($from, $to)
    {
        $transactions = Sale::whereBetween('created_at', [$from, $to])
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
            ->orderBy('created_at', 'desc')
            ->get();
        return ['transactions' => $transactions];
    }

    private function getGeneralSalesData($from, $to)
    {
        $data = Sale::whereBetween('created_at', [$from, $to])
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
            ->orderBy('created_at', 'desc')
            ->get();
        return ['transactions' => $data];
    }

    private function getSoldItemsData($from, $to)
    {
        $items = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$from, $to])
            ->select(
                'sale_items.product_name as Item_Name', 
                'sale_items.size as Size', 
                DB::raw('SUM(sale_items.quantity) as Total_Qty'), 
                DB::raw('SUM(sale_items.final_price) as Total_Sales')
            )
            ->groupBy('sale_items.product_name', 'sale_items.size')
            ->orderBy('Total_Qty', 'desc')
            ->get();
        return ['items' => $items];
    }

    private function getCashCountData($date)
    {
        $cashCount = DB::table('cash_counts')->whereDate('created_at', $date)->latest()->first();
        return [
            'cash_count' => [
                'denominations' => $cashCount ? json_decode($cashCount->denominations_data) : [],
                'grand_total' => $cashCount ? (float)$cashCount->total_amount : 0
            ]
        ];
    }

    /* --- PUBLIC ENDPOINTS (Standard Routes) --- */

    public function getHourlySales(Request $request)
    {
        $date = $request->query('date');
        $hourlyData = Sale::whereDate('created_at', $date)
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('hour')->orderBy('hour')->get();

        return response()->json([
            'hourly_data' => $hourlyData,
            'prepared_by' => auth()->user()->name ?? 'System Admin'
        ]);
    }

    public function getItemQuantities(Request $request)
    {
        $date = $request->query('date');
        $data = $this->getSoldItemsData($date . ' 00:00:00', $date . ' 23:59:59');
        
        $items = collect($data['items'])->map(fn($i) => [
            'product_name' => $i->Item_Name,
            'total_qty' => (int)$i->Total_Qty,
            'total_sales' => (float)$i->Total_Sales
        ]);

        $total = $items->sum('total_sales');
        return response()->json([
            'report_type' => 'qty_items',
            'items' => $items,
            'grand_total_revenue' => round($total, 2),
            'vatable_sales' => round($total / 1.12, 2),
            'vat_amount' => round($total - ($total / 1.12), 2),
            'prepared_by' => auth()->user()->name ?? 'System Admin'
        ]);
    }

    public function getCashCountSummary(Request $request)
    {
        $date = $request->query('date');
        return response()->json(array_merge($this->getCashCountData($date), [
            'prepared_by' => auth()->user()->name ?? 'System Admin'
        ]));
    }

    public function getVoidLogs(Request $request)
    {
        $date = $request->query('date');
        $voids = Sale::whereDate('created_at', $date)->where('status', 'cancelled')
            ->select('id', 'invoice_number as reason', 'total_amount as amount', DB::raw("DATE_FORMAT(created_at, '%h:%i %p') as time"))->get();
        return response()->json(['logs' => $voids, 'prepared_by' => auth()->user()->name ?? 'System Admin']);
    }

    public function getDetailedSales(Request $request)
    {
        $date = $request->query('date');
        $data = $this->getDetailedData($date . ' 00:00:00', $date . ' 23:59:59');
        return response()->json(array_merge($data, ['prepared_by' => auth()->user()->name ?? 'System Admin']));
    }

    public function getSummaryReport(Request $request)
    {
        $from = $request->query('from', $request->query('date')) . ' 00:00:00';
        $to = $request->query('to', $request->query('date')) . ' 23:59:59';
        return response()->json(array_merge($this->getSummaryData($from, $to), ['prepared_by' => auth()->user()->name ?? 'System Admin']));
    }
}