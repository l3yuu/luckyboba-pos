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
public function getSummaryReport(Request $request)
{
    try {
        // Extract dates from the query parameters sent by React
        $from = $request->query('from') . ' 00:00:00';
        $to = $request->query('to') . ' 23:59:59';

        $data = Sale::whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw('DATE(created_at) as Sales_Date'),
                DB::raw('COUNT(id) as Total_Orders'),
                DB::raw('SUM(total_amount) as Daily_Revenue')
            )
            ->groupBy('Sales_Date')
            ->orderBy('Sales_Date', 'desc')
            ->get();

        // Return as a JSON object that matches your React expectations
        return response()->json($data);

    } catch (\Exception $e) {
        Log::error("Summary Report Error: " . $e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
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

    public function exportSales(Request $request)
    {
        $date = $request->query('date');
        $fileName = "lucky_boba_sales_{$date}.csv";
        
        // Fetch your sales for the Lucky Boba branch
        $sales = Sale::whereDate('created_at', $date)->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Total Amount', 'Items Count', 'Payment Type', 'Created At'];

        $callback = function() use($sales, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->id,
                    $sale->total_amount,
                    $sale->items_count,
                    $sale->payment_method,
                    $sale->created_at
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function getHourlySales(Request $request) 
    {
        $date = $request->query('date');

        // Example logic to group sales by hour
        $hourlyData = Sale::whereDate('created_at', $date)
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'date' => $date,
            'report_type' => 'hourly_sales',
            'hourly_data' => $hourlyData,
            // Include default values to prevent frontend breaks
            'gross_sales' => $hourlyData->sum('total'),
            'net_sales' => $hourlyData->sum('total'),
            'transaction_count' => $hourlyData->sum('count'),
        ]);
    }

public function getItemQuantities(Request $request) {
    $date = $request->query('date');
    $items = DB::table('sale_items')
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->whereDate('sales.created_at', $date)
        ->select('product_name', DB::raw('SUM(quantity) as total_qty'))
        ->groupBy('product_name')
        ->get();

    return response()->json([
        'date' => $date,
        'items' => $items
    ]);
}

public function getDetailedSales(Request $request) 
{
    $date = $request->query('date');

    // Fetch individual sales with invoice numbers and statuses
    $data = Sale::whereDate('created_at', $date)
        ->select(
            'invoice_number as Invoice',
            'total_amount as Amount',
            'status as Status',
            'created_at as Date_Time'
        )
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json([
        'date' => $date,
        'report_type' => 'detailed',
        'transactions' => $data
    ]);
}

public function getCashCountSummary(Request $request) 
{
    $date = $request->query('date');

    $cashCount = DB::table('cash_counts')
        ->whereDate('created_at', $date)
        ->latest() // Get the most recent count for that day
        ->first();

    if (!$cashCount) {
        // Return an empty structure instead of a 404 to prevent frontend crashes
        return response()->json([
            'date' => $date,
            'report_type' => 'cash_count',
            'cash_count' => [
                'denominations' => [],
                'grand_total' => 0
            ],
            'message' => 'No cash count found'
        ]);
    }

    return response()->json([
        'date' => $date,
        'report_type' => 'cash_count',
        'cash_count' => [
            // Ensure denominations_data is decoded from JSON correctly
            'denominations' => json_decode($cashCount->denominations_data) ?? [], 
            'grand_total' => $cashCount->total_amount
        ]
    ]);
}

// app/Http/Controllers/Api/ReportController.php

public function getVoidLogs(Request $request) 
{
    try {
        $date = $request->query('date');

        // Fetch cancelled/voided transactions for the day
        $voids = Sale::whereDate('created_at', $date)
            ->where('status', 'Cancelled') // or 'Voided' based on your DB status values
            ->select(
                'id',
                'invoice_number as reason', // You can use invoice or a specific cancel_reason column
                'total_amount as amount',
                DB::raw("DATE_FORMAT(created_at, '%h:%i %p') as time")
            )
            ->get();

        return response()->json([
            'date' => $date,
            'report_type' => 'void_logs',
            'logs' => $voids
        ]);

    } catch (\Exception $e) {
        Log::error("Void Logs Error: " . $e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
}

// ReportController.php

public function exportItems(Request $request)
{
    $date = $request->query('date');
    $fileName = "lucky_boba_items_{$date}.csv";
    
    // Fetch sold items for the day
    $items = DB::table('sale_items')
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->whereDate('sales.created_at', $date)
        ->select('product_name', DB::raw('SUM(quantity) as total_qty'))
        ->groupBy('product_name')
        ->get();

    $headers = [
        "Content-type"        => "text/csv",
        "Content-Disposition" => "attachment; filename=$fileName",
    ];

    $callback = function() use($items) {
        $file = fopen('php://output', 'w');
        fputcsv($file, ['Product Name', 'Total Qty Sold']);
        foreach ($items as $item) {
            fputcsv($file, [$item->product_name, $item->total_qty]);
        }
        fclose($file);
    };

    return response()->stream($callback, 200, $headers);
}
}