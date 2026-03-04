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
    public function getFoodMenu()
    {
        try {
            $menu = DB::table('menu_items')
                ->join('categories', 'menu_items.category_id', '=', 'categories.id')
                ->select(
                    'menu_items.name as Product_Name',
                    'categories.name as Category',
                    'menu_items.barcode as SKU',
                    'menu_items.quantity as Current_Stock',
                    'menu_items.cost as Cost_Price',
                    'menu_items.price as Selling_Price'
                )
                ->where('categories.type', '!=', 'standard') // Hides discounts/cards
                ->orderBy('categories.name')
                ->get();

            return response()->json($menu->values());
        } catch (\Exception $e) {
            Log::error("Food Menu Report Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch menu items'], 500);
        }
    }

    public function getSalesReport(Request $request)
    {
        try {
            $from = $request->query('from', date('Y-m-d')) . ' 00:00:00';
            $to   = $request->query('to', date('Y-m-d')) . ' 23:59:59';
            $type = $request->query('type', 'SALES');

            switch ($type) {
                case 'SUMMARY':
                    // Daily aggregation for the Summary Excel sheet
                    $data = DB::table('sales')
                        ->select(
                            DB::raw('DATE(created_at) as Sales_Date'),
                            DB::raw('COUNT(id) as Total_Orders'),
                            DB::raw('SUM(total_amount) as Daily_Revenue')
                        )
                        ->whereBetween('created_at', [$from, $to])
                        ->where('status', 'completed')
                        ->groupBy('Sales_Date')
                        ->orderBy('Sales_Date', 'desc')
                        ->get();
                    break;

                case 'SOLD_ITEMS':
                    // Detailed breakdown of which boba flavors sold most
                    $data = DB::table('sale_items')
                        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                        ->select(
                            'sale_items.product_name as Item_Name',
                            DB::raw('SUM(sale_items.quantity) as Total_Qty'),
                            DB::raw('SUM(sale_items.final_price) as Total_Revenue')
                        )
                        ->whereBetween('sales.created_at', [$from, $to])
                        ->where('sales.status', 'completed')
                        ->groupBy('sale_items.product_name')
                        ->get();
                    break;

                case 'PAYMENTS':
                    // List of transactions focused on payment methods
                    $data = Sale::whereBetween('created_at', [$from, $to])
                        ->select('invoice_number as Invoice', 'payment_method as Method', 'total_amount as Amount', 'created_at as Date')
                        ->where('status', 'completed')
                        ->get();
                    break;

                default:
                    // General Sales List (matches your 'SALES' button)
                    $data = Sale::whereBetween('created_at', [$from, $to])
                        ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
                        ->orderBy('created_at', 'desc')
                        ->get();
                    break;
            }

            // Return values() to ensure it is always a clean array for XLSX
            return response()->json($data->values());

        } catch (\Exception $e) {
            Log::error("Sales Aggregator Error: " . $e->getMessage());
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
        $user = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $rawItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', 'completed')
            ->select(
                'categories.name as category_name',
                'categories.type as category_type',
                'sale_items.*',
                // Attach the cup size_m / size_l labels from the cups table via category
                DB::raw("COALESCE(cups.size_m, 'M') as cup_size_m"),
                DB::raw("COALESCE(cups.size_l, 'L') as cup_size_l")
            )
            ->leftJoin('cups', 'categories.cup_id', '=', 'cups.id')
            ->get();

        $globalAddonSummary = [];

        $groupedData = $rawItems->groupBy('category_name')->map(function ($items, $category) use (&$globalAddonSummary) {

            // Group by product_name + size together
            $productSummary = $items->groupBy(function ($item) {
                $size = $item->size ?? null; // 'M', 'L', or null
                return $item->product_name . '||' . ($size ?? 'none');
            })->map(function ($pGroup) use (&$globalAddonSummary) {

                $firstItem = $pGroup->first();
                $rawSize   = $firstItem->size ?? null;        // 'M' or 'L' or null
                $cupSizeM  = $firstItem->cup_size_m ?? 'SM';  // e.g. 'SM', 'UM', 'PCM'
                $cupSizeL  = $firstItem->cup_size_l ?? 'SL';  // e.g. 'SL', 'UL', 'PCL'

                // Map generic M/L → branded cup size label
                $sizeLabel = null;
                if ($rawSize === 'M') $sizeLabel = $cupSizeM;
                elseif ($rawSize === 'L') $sizeLabel = $cupSizeL;

                $productAddOnCounts = [];
                foreach ($pGroup as $item) {
                    $addons = json_decode($item->add_ons) ?? [];
                    foreach ($addons as $addonName) {
                        $productAddOnCounts[$addonName] = ($productAddOnCounts[$addonName] ?? 0) + $item->quantity;
                        $globalAddonSummary[$addonName] = ($globalAddonSummary[$addonName] ?? 0) + $item->quantity;
                    }
                }

                $formattedAddons = [];
                foreach ($productAddOnCounts as $name => $qty) {
                    $formattedAddons[] = ['name' => $name, 'qty' => $qty];
                }

                return [
                    'product_name' => $firstItem->product_name,
                    'size'         => $sizeLabel,   // e.g. "SM", "SL", "JR", null
                    'total_qty'    => (int) $pGroup->sum('quantity'),
                    'total_sales'  => (float) $pGroup->sum('final_price'),
                    'add_ons'      => $formattedAddons,
                ];
            })->values();

            return [
                'category_name'  => $category,
                'products'       => $productSummary,
                'category_total' => (float) $productSummary->sum('total_sales'),
            ];
        })->values();

        $grandTotal = (float) $rawItems->sum('final_price');
        $addonsList = [];
        foreach ($globalAddonSummary as $name => $qty) {
            $addonsList[] = ['name' => $name, 'qty' => $qty];
        }

        return response()->json([
            'date'                => $date,
            'report_type'         => 'qty_items',
            'categories'          => $groupedData,
            'all_addons_summary'  => $addonsList,
            'grand_total_revenue' => round($grandTotal, 2),
            'vatable_sales'       => round($grandTotal / 1.12, 2),
            'vat_amount'          => round($grandTotal - ($grandTotal / 1.12), 2),
            'prepared_by'         => $cashierName,
        ]);
    }

    public function getHourlySales(Request $request) {
        $date = $request->query('date');
        $user = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $hourlyData = Sale::whereDate('created_at', $date)
            ->where('status', '!=', 'cancelled') 
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

    /**
     * GET /api/reports/sales-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
     */
public function getSalesSummary(Request $request)
{
    try {
        $from = $request->query('from', now()->toDateString()) . ' 00:00:00';
        $to   = $request->query('to',   now()->toDateString()) . ' 23:59:59';

        $data = $this->getSummaryData($from, $to);

        $paymentBreakdown = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->selectRaw('payment_method as method, SUM(total_amount) as amount')
            ->groupBy('payment_method')
            ->get();

        $gross        = $data['gross_sales'];
        $vatableSales = round($gross / 1.12, 2);
        $vatAmount    = round($gross - $vatableSales, 2);

        $discountTotals = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->selectRaw('SUM(pax_senior) as total_senior_pax, SUM(pax_pwd) as total_pwd_pax, SUM(pax_diplomat) as total_diplomat_pax')
            ->first();

        // ── Use stored vatable_sales per sale to calculate SC discount correctly ──
        // SC/PWD get 20% off the vatable portion per pax, not 20% of total_amount
        $seniorRows = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->where('pax_senior', '>', 0)
            ->selectRaw('
                COALESCE(pax_senior, 0) as pax_senior,
                COALESCE(pax_pwd, 0) as pax_pwd,
                COALESCE(pax_diplomat, 0) as pax_diplomat,
                total_amount,
                COALESCE(vatable_sales, total_amount / 1.12) as vatable_sales,
                (COALESCE(pax_regular, 0) + COALESCE(pax_senior, 0) + 
                COALESCE(pax_pwd, 0) + COALESCE(pax_diplomat, 0)) as total_pax
            ')
            ->get();

            Log::info('Senior rows found: ' . $seniorRows->count());
Log::info('Senior rows data: ' . $seniorRows->toJson());

        $seniorDiscount = 0;
        $pwdDiscount    = 0;

        foreach ($seniorRows as $row) {
            $totalPax   = max(1, (int)$row->total_pax);
            $sharePerPax = (float)$row->vatable_sales / $totalPax;
            $seniorDiscount += (int)$row->pax_senior * ($sharePerPax * 0.20);
            $pwdDiscount    += (int)$row->pax_pwd    * ($sharePerPax * 0.20);
        }

        // Also catch pwd-only rows
        $pwdOnlyRows = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->where('pax_pwd', '>', 0)      // ← corrected
            ->where('pax_senior', '=', 0)   // ← exclude rows already counted in $seniorRows
            ->selectRaw('
                COALESCE(pax_senior, 0) as pax_senior,
                COALESCE(pax_pwd, 0) as pax_pwd,
                COALESCE(pax_diplomat, 0) as pax_diplomat,
                total_amount,
                COALESCE(vatable_sales, total_amount / 1.12) as vatable_sales,
                (COALESCE(pax_regular, 0) + COALESCE(pax_senior, 0) + 
                COALESCE(pax_pwd, 0) + COALESCE(pax_diplomat, 0)) as total_pax
            ')
            ->get();

        foreach ($pwdOnlyRows as $row) {
            $totalPax    = max(1, (int)$row->total_pax);
            $sharePerPax = (float)$row->vatable_sales / $totalPax;
            $pwdDiscount += (int)$row->pax_pwd * ($sharePerPax * 0.20);
        }

        $diplomatDiscount = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->where('pax_diplomat', '>', 0)
            ->selectRaw('SUM(total_amount * 0.20) as total')
            ->value('total') ?? 0;

        return response()->json(array_merge($data, [
            'payment_breakdown'  => $paymentBreakdown,
            'vatable_sales'      => $vatableSales,
            'vat_amount'         => $vatAmount,
            'sc_discount'        => round((float)$seniorDiscount,   2),
            'pwd_discount'       => round((float)$pwdDiscount,      2),
            'diplomat_discount'  => round((float)$diplomatDiscount, 2),
            'sc_pwd_discount'    => round((float)$seniorDiscount + (float)$pwdDiscount, 2),
            'total_senior_pax'   => (int)($discountTotals->total_senior_pax   ?? 0),
            'total_pwd_pax'      => (int)($discountTotals->total_pwd_pax      ?? 0),
            'total_diplomat_pax' => (int)($discountTotals->total_diplomat_pax ?? 0),
        ]));

    } catch (\Exception $e) {
        Log::error("getSalesSummary Error: " . $e->getMessage());
        return response()->json(['error' => 'Failed to generate summary report'], 500);
    }
}

    /**
     * GET /api/reports/sales-detailed?date=YYYY-MM-DD
     */
    public function getSalesDetailed(Request $request)
    {
        try {
            $date = $request->query('date', now()->toDateString());
            $from = $date . ' 00:00:00';
            $to   = $date . ' 23:59:59';

            $transactions = Sale::whereBetween('sales.created_at', [$from, $to])
                ->leftJoin('users', 'users.id', '=', 'sales.user_id')
                ->selectRaw('
                    sales.invoice_number                                          as Invoice,
                    sales.total_amount                                            as Amount,
                    sales.status                                                  as Status,
                    sales.created_at                                              as Date_Time,
                    sales.payment_method                                          as Method,
                    COALESCE(users.name, "N/A")                                   as Cashier,
                    COALESCE(sales.vatable_sales, ROUND(sales.total_amount / 1.12, 2)) as Vatable,
                    COALESCE(sales.vat_amount,    ROUND(sales.total_amount - (sales.total_amount / 1.12), 2)) as Tax,
                    (COALESCE(sales.pax_senior, 0) + COALESCE(sales.pax_pwd, 0)) as Disc_Pax,
                    (SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = sales.id) as Items_Count
                ')
                ->orderBy('sales.created_at', 'desc')
                ->get();

            return response()->json([
                'transactions' => $transactions,
            ]);

        } catch (\Exception $e) {
            Log::error("getSalesDetailed Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Kept for backward compatibility
    public function getDetailedSales(Request $request) { return $this->getSalesDetailed($request); }
    public function getSummaryReport(Request $request) { return $this->getSalesSummary($request); }
}