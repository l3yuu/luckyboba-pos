<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function getSalesReport(Request $request)
    {
        try {
            $request->validate([
                'from' => 'required|date',
                'to' => 'required|date',
                'type' => 'required|string'
            ]);

            $from = $request->from . ' 00:00:00';
            $to = $request->to . ' 23:59:59';
            $type = $request->type;

            switch ($type) {
                case 'SUMMARY':
                    return response()->json($this->getSummaryReport($from, $to));
                case 'SOLD_ITEMS':
                    return response()->json($this->getSoldItemsReport($from, $to));
                case 'PAYMENTS':
                    return response()->json($this->getPaymentReport($from, $to));
                case 'SALES':
                default:
                    return response()->json($this->getGeneralSalesReport($from, $to));
            }
        } catch (\Exception $e) {
            Log::error("Report Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Detailed Sales Report
     * MATCHED TO: total_amount, invoice_number, status
     */
    private function getGeneralSalesReport($from, $to)
    {
        return Sale::whereBetween('created_at', [$from, $to])
            ->select(
                'invoice_number as Invoice',
                'total_amount as Amount',
                'status as Status',
                'created_at as Date_Time'
            )
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Sales Summary per Day
     * MATCHED TO: total_amount
     */
    private function getSummaryReport($from, $to)
    {
        return Sale::whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw('DATE(created_at) as Sales_Date'),
                DB::raw('COUNT(id) as Total_Orders'),
                DB::raw('SUM(total_amount) as Daily_Revenue')
            )
            ->groupBy('Sales_Date')
            ->orderBy('Sales_Date', 'desc')
            ->get();
    }

    /**
     * Sold Items Report (Already functioning)
     * MATCHED TO: product_name, final_price
     */
    private function getSoldItemsReport($from, $to)
    {
        return DB::table('sale_items')
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
    }

    /**
     * Payments Report
     * MATCHED TO: invoice_number, total_amount, payment_method
     */
    private function getPaymentReport($from, $to)
    {
        return Sale::whereBetween('created_at', [$from, $to])
            ->select(
                'invoice_number as Invoice',
                'total_amount as Amount',
                'payment_method as Method',
                'created_at as Date'
            )
            ->get();
    }

    public function getFoodMenuReport()
    {
        try {
            // MATCHED TO YOUR DATABASE: 'menu_items' table and its column names
            $data = DB::table('menu_items')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->select(
                    'menu_items.name as Item_Name',
                    'menu_items.barcode as Barcode',
                    'categories.name as Category',
                    'menu_items.price as Selling_Price', // MATCHED: 'price'
                    'menu_items.cost as Unit_Cost'       // MATCHED: 'cost'
                )
                ->get();

            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error("Food Menu Export Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}