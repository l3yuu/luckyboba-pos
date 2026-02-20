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

    public function getItemQuantities(Request $request) {
        $date = $request->query('date');
        
        // 1. Fetch raw items with category names
        $rawItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', 'completed') 
            ->select(
                'categories.name as category_name',
                'sale_items.product_name',
                'sale_items.quantity',
                'sale_items.final_price',
                'sale_items.add_ons' // This is your JSON column
            )
            ->get();

        // 2. Process and Group Data
        $groupedData = $rawItems->groupBy('category_name')->map(function ($items, $category) {
            $productSummary = $items->groupBy('product_name')->map(function ($pGroup, $pName) {
                
                // Count Add-ons for this specific product
                $addOnCounts = [];
                foreach ($pGroup as $item) {
                    $addons = json_decode($item->add_ons) ?? [];
                    foreach ($addons as $addonName) {
                        $addOnCounts[$addonName] = ($addOnCounts[$addonName] ?? 0) + $item->quantity;
                    }
                }

                // Format add-ons for frontend
                $formattedAddons = [];
                foreach ($addOnCounts as $name => $qty) {
                    $formattedAddons[] = ['name' => $name, 'qty' => $qty];
                }

                return [
                    'product_name' => $pName,
                    'total_qty'    => $pGroup->sum('quantity'),
                    'total_sales'  => (float) $pGroup->sum('final_price'),
                    'add_ons'      => $formattedAddons
                ];
            })->values();

            return [
                'category_name' => $category,
                'products'      => $productSummary
            ];
        })->values();

        $grandTotal = $rawItems->sum('final_price');

        return response()->json([
            'date' => $date,
            'report_type' => 'qty_items',
            'categories' => $groupedData, // New structured key
            'grand_total_revenue' => $grandTotal,
            'vatable_sales' => round($grandTotal / 1.12, 2),
            'vat_amount' => round($grandTotal - ($grandTotal / 1.12), 2),
            'prepared_by' => auth()->user()->name
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