<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function getSalesReport(Request $request)
    {
        try {
            // Use the query 'date' if 'from' is missing (for single-day buttons)
            $dateParam = $request->query('date', date('Y-m-d'));
            $from = ($request->from ?? $dateParam) . ' 00:00:00';
            $to   = ($request->to   ?? $dateParam) . ' 23:59:59';
            $type = $request->type ?? 'SALES';

            switch ($type) {
                case 'SUMMARY':
                    $data = $this->getSummaryData($from, $to);
                    break;
                case 'PAYMENTS':
                case 'DETAILED':
                    $data = $this->getDetailedData($from, $to);
                    break;
                default:
                    $data = $this->getGeneralSalesData($from, $to);
                    break;
            }

            return response()->json(array_merge($data, [
                'prepared_by' => auth()->user()->name ?? 'System Admin'
            ]));

        } catch (\Exception $e) {
            Log::error("Aggregator Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error: Check Laravel Logs'], 500);
        }
    }
    
    private function getSummaryData($from, $to)
    {
        try {
            // 1. Daily Sales List
            $summary = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->select(
                    DB::raw('DATE(created_at) as Sales_Date'),
                    DB::raw('COUNT(id) as Total_Orders'),
                    DB::raw('SUM(total_amount) as Daily_Revenue')
                )
                ->groupBy('Sales_Date')
                ->orderBy('Sales_Date', 'desc')
                ->get();

            // 2. Aggregate Metrics
            $totalGross = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->sum('total_amount') ?? 0;

            // We use a fallback here to prevent the 500 error if column names differ
            // Check if your column is 'total_discount' or 'discount_amount'
            $totalDiscounts = 0;
            if (\Schema::hasColumn('sales', 'total_discount')) {
                $totalDiscounts = Sale::whereBetween('created_at', [$from, $to])->where('status', 'completed')->sum('total_discount');
            } elseif (\Schema::hasColumn('sales', 'discount_amount')) {
                $totalDiscounts = Sale::whereBetween('created_at', [$from, $to])->where('status', 'completed')->sum('discount_amount');
            }

            $totalVoids = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'cancelled')
                ->sum('total_amount') ?? 0;

            return [
                'summary_data'      => $summary,
                'total_discounts'   => (float)$totalDiscounts,
                'total_void_amount' => (float)$totalVoids,
                'gross_sales'       => (float)$totalGross,
                'from_date'         => $from,
                'to_date'           => $to
            ];
        } catch (\Exception $e) {
            // This will print the REAL error in your storage/logs/laravel.log
            Log::error("Summary Logic Error: " . $e->getMessage());
            throw $e; 
        }
    }

    private function getDetailedData($from, $to)
    {
        $transactions = Sale::whereBetween('created_at', [$from, $to])
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
            ->orderBy('created_at', 'desc')
            ->get();
        return ['search_results' => $transactions, 'transactions' => $transactions];
    }

    private function getGeneralSalesData($from, $to)
    {
        $data = Sale::whereBetween('created_at', [$from, $to])
            ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
            ->orderBy('created_at', 'desc')
            ->get();
        return ['transactions' => $data];
    }

    public function getItemQuantities(Request $request) {
        $date = $request->query('date');
        
        $rawItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', 'completed') 
            ->select('categories.name as category_name', 'sale_items.*')
            ->get();

        $groupedData = $rawItems->groupBy('category_name')->map(function ($items, $category) {
            $productSummary = $items->groupBy('product_name')->map(function ($pGroup, $pName) {
                $addOnCounts = [];
                foreach ($pGroup as $item) {
                    $addons = json_decode($item->add_ons) ?? [];
                    foreach ($addons as $addonName) {
                        $addOnCounts[$addonName] = ($addOnCounts[$addonName] ?? 0) + $item->quantity;
                    }
                }
                $formattedAddons = [];
                foreach ($addOnCounts as $name => $qty) {
                    $formattedAddons[] = ['name' => $name, 'qty' => $qty];
                }
                return [
                    'product_name' => $pName,
                    'total_qty'    => (int) $pGroup->sum('quantity'),
                    'total_sales'  => (float) $pGroup->sum('final_price'),
                    'add_ons'      => $formattedAddons
                ];
            })->values();

            return [
                'category_name'  => $category,
                'products'       => $productSummary,
                'category_total' => (float) $productSummary->sum('total_sales')
            ];
        })->values();

        $grandTotal = (float) $rawItems->sum('final_price');

        return response()->json([
            'date' => $date,
            'report_type' => 'qty_items',
            'categories' => $groupedData,
            'grand_total_revenue' => round($grandTotal, 2),
            'vatable_sales' => round($grandTotal / 1.12, 2),
            'vat_amount' => round($grandTotal - ($grandTotal / 1.12), 2),
            'prepared_by' => auth()->user()->name ?? 'System Admin'
        ]);
    }

public function getHourlySales(Request $request) {
        $date = $request->query('date');
        
        // Safely extract the logged-in user to fix "System Admin" bug
        $user = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $hourlyData = Sale::whereDate('created_at', $date)
            ->where('status', '!=', 'cancelled') // <-- FIX: EXCLUDES VOIDED SALES
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();
            
        return response()->json([
            'hourly_data' => $hourlyData, 
            'prepared_by' => $cashierName
        ]);
    }

    public function getCashCountSummary(Request $request) {
        $date = $request->query('date');
        $cashCount = DB::table('cash_counts')->whereDate('created_at', $date)->latest()->first();
        return response()->json([
            'cash_count' => [
                'denominations' => $cashCount ? json_decode($cashCount->denominations_data) : [],
                'grand_total' => $cashCount ? (float)$cashCount->total_amount : 0
            ],
            'prepared_by' => auth()->user()->name ?? 'System Admin'
        ]);
    }

    public function getVoidLogs(Request $request) {
        $date = $request->query('date');
        $voids = Sale::whereDate('created_at', $date)->where('status', 'cancelled')
            ->select('id', 'invoice_number as reason', 'total_amount as amount', DB::raw("DATE_FORMAT(created_at, '%h:%i %p') as time"))->get();
        return response()->json(['logs' => $voids, 'prepared_by' => auth()->user()->name ?? 'System Admin']);
    }

    public function exportSales(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $sales = Sale::whereDate('created_at', $date)
                     ->where('status', '!=', 'cancelled')
                     ->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=lucky_boba_sales_{$date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($sales) {
            $file = fopen('php://output', 'w');
            
            // CSV Header Row
            fputcsv($file, ['Invoice Number', 'Payment Method', 'Total Amount', 'Status', 'Date Time']);

            // CSV Data Rows
            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->invoice_number,
                    $sale->payment_method,
                    $sale->total_amount,
                    $sale->status,
                    $sale->created_at->format('Y-m-d H:i:s')
                ]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function exportItems(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        // Get all items sold on this date, excluding cancelled sales
        $items = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', '!=', 'cancelled')
            ->select(
                'sale_items.product_name',
                \DB::raw('SUM(sale_items.quantity) as total_qty'),
                \DB::raw('SUM(sale_items.final_price) as total_sales')
            )
            ->groupBy('sale_items.product_name')
            ->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=lucky_boba_items_{$date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($items) {
            $file = fopen('php://output', 'w');
            
            // CSV Header Row
            fputcsv($file, ['Product Name', 'Quantity Sold', 'Total Revenue']);

            // CSV Data Rows
            foreach ($items as $item) {
                fputcsv($file, [
                    $item->product_name,
                    $item->total_qty,
                    $item->total_sales
                ]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function getDetailedSales(Request $request) { return $this->getSalesReport($request); }
    public function getSummaryReport(Request $request) { return $this->getSalesReport($request); }
}