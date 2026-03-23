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
                ->where('categories.type', '!=', 'standard')
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
                    $data = Sale::whereBetween('created_at', [$from, $to])
                        ->select('invoice_number as Invoice', 'payment_method as Method', 'total_amount as Amount', 'created_at as Date')
                        ->where('status', 'completed')
                        ->get();
                    break;

                default:
                    $data = Sale::whereBetween('created_at', [$from, $to])
                        ->select('invoice_number as Invoice', 'total_amount as Amount', 'status as Status', 'created_at as Date_Time')
                        ->orderBy('created_at', 'desc')
                        ->get();
                    break;
            }

            return response()->json($data->values());

        } catch (\Exception $e) {
            Log::error("Sales Aggregator Error: " . $e->getMessage());
            return response()->json(['error' => 'Server Error: Check Laravel Logs'], 500);
        }
    }

    private function getSummaryData($from, $to)
    {
        try {
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

            $totalGross = Sale::whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->sum('total_amount') ?? 0;

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

    public function getItemQuantities(Request $request)
    {
        $date        = $request->query('date');
        $user        = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $rawItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('bundles', 'sale_items.bundle_id', '=', 'bundles.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', 'completed')
            ->select(
                DB::raw("COALESCE(bundles.category, categories.name, 'UNCATEGORIZED') as category_name"),
                DB::raw("COALESCE(categories.type, 'drink') as category_type"),
                'sale_items.*',
                DB::raw("CASE WHEN sale_items.bundle_id IS NOT NULL THEN COALESCE(bundles.display_name, bundles.name, sale_items.product_name) ELSE sale_items.product_name END as resolved_product_name"),
                DB::raw("COALESCE(cups.size_m, 'M') as cup_size_m"),
                DB::raw("COALESCE(cups.size_l, 'L') as cup_size_l")
            )
            ->leftJoin('cups', 'categories.cup_id', '=', 'cups.id')
            ->get();

        $globalAddonSummary = [];

        $groupedData = $rawItems->groupBy('category_name')->map(function ($items, $category) use (&$globalAddonSummary) {
            $productSummary = $items->groupBy(function ($item) {
                $size = $item->size ?? null;
                $name = $item->resolved_product_name ?? $item->product_name;
                return $name . '||' . ($size ?? 'none');
            })->map(function ($pGroup) use (&$globalAddonSummary) {
                $firstItem = $pGroup->first();
                $rawSize   = $firstItem->size ?? null;
                $cupSizeM  = $firstItem->cup_size_m ?? 'SM';
                $cupSizeL  = $firstItem->cup_size_l ?? 'SL';

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
                    'product_name' => $firstItem->resolved_product_name ?? $firstItem->product_name,
                    'size'         => $sizeLabel,
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

    public function getHourlySales(Request $request)
    {
        $date        = $request->query('date');
        $user        = auth('sanctum')->user() ?? $request->user();
        $cashierName = $user ? $user->name : 'System Admin';

        $hourlyData = Sale::whereDate('created_at', $date)
            ->where('status', '!=', 'cancelled')
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'hourly_data' => $hourlyData,
            'prepared_by' => $cashierName,
        ]);
    }

    public function getCashCountSummary(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        try {
            $cashCount = DB::table('cash_counts')
                ->where(function ($q) use ($date) {
                    $q->whereDate('date', $date)
                      ->orWhereDate('created_at', $date);
                })
                ->latest()
                ->first();

            if (!$cashCount) {
                return response()->json([
                    'cash_count'    => null,
                    'denominations' => [],
                    'grand_total'   => 0,
                    'message'       => 'No cash count recorded for this date.',
                ]);
            }

            $breakdown = $cashCount->breakdown ?? $cashCount->denominations_data ?? '[]';
            if (is_string($breakdown)) {
                $breakdown = json_decode($breakdown, true) ?? [];
            }

            $allDenoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

            $denominations = collect($allDenoms)->map(function ($denom) use ($breakdown) {
                $qty = 0;
                foreach ($breakdown as $key => $val) {
                    if ((float)$key === (float)$denom) {
                        $qty = (int)$val;
                        break;
                    }
                }
                return [
                    'label' => $denom == 0.25 ? '0.25' : number_format((float)$denom, 0),
                    'qty'   => $qty,
                    'total' => (float)$denom * $qty,
                ];
            })->values()->toArray();

            $actualAmount   = (float) ($cashCount->actual_amount  ?? $cashCount->total_amount  ?? 0);
            $expectedAmount = (float) ($cashCount->expected_amount ?? $cashCount->expected_cash ?? 0);
            $shortOver      = (float) ($cashCount->short_over      ?? ($actualAmount - $expectedAmount));

            $user = auth('sanctum')->user() ?? $request->user();

            return response()->json([
                'cash_count' => [
                    'denominations' => $denominations,
                    'grand_total'   => $actualAmount,
                ],
                'expected_amount' => $expectedAmount,
                'actual_amount'   => $actualAmount,
                'short_over'      => $shortOver,
                'date'            => $cashCount->date ?? $date,
                'remarks'         => $cashCount->remarks ?? '',
                'prepared_by'     => $user ? $user->name : 'System Admin',
            ]);

        } catch (\Exception $e) {
            Log::error('CashCount summary error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function getVoidLogs(Request $request)
    {
        $date  = $request->query('date');
        $voids = Sale::whereDate('created_at', $date)
            ->where('status', 'cancelled')
            ->select('id', 'invoice_number as reason', 'total_amount as amount', DB::raw("DATE_FORMAT(created_at, '%h:%i %p') as time"))
            ->get();

        return response()->json([
            'logs'        => $voids,
            'prepared_by' => auth()->user()->name ?? 'System Admin',
        ]);
    }

    public function exportSales(Request $request)
    {
        $date  = $request->query('date', now()->toDateString());
        $sales = Sale::whereDate('created_at', $date)
            ->where('status', '!=', 'cancelled')
            ->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=lucky_boba_sales_{$date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0",
        ];

        $callback = function () use ($sales) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Invoice Number', 'Payment Method', 'Total Amount', 'Status', 'Date Time']);
            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->invoice_number,
                    $sale->payment_method,
                    $sale->total_amount,
                    $sale->status,
                    $sale->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function exportItems(Request $request)
    {
        $date  = $request->query('date', now()->toDateString());
        $items = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.created_at', $date)
            ->where('sales.status', '!=', 'cancelled')
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.final_price) as total_sales')
            )
            ->groupBy('sale_items.product_name')
            ->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=lucky_boba_items_{$date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0",
        ];

        $callback = function () use ($items) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Product Name', 'Quantity Sold', 'Total Revenue']);
            foreach ($items as $item) {
                fputcsv($file, [$item->product_name, $item->total_qty, $item->total_sales]);
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

            // ── Discount calculations from sale_items (no pax columns needed) ──
            $scDiscount = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereBetween('sales.created_at', [$from, $to])
                ->where('sales.status', 'completed')
                ->where('sale_items.discount_label', 'LIKE', '%SENIOR%')
                ->sum('sale_items.discount_amount');

            $pwdDiscount = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereBetween('sales.created_at', [$from, $to])
                ->where('sales.status', 'completed')
                ->where('sale_items.discount_label', 'LIKE', '%PWD%')
                ->sum('sale_items.discount_amount');

            $diplomatDiscount = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereBetween('sales.created_at', [$from, $to])
                ->where('sales.status', 'completed')
                ->where('sale_items.discount_label', 'LIKE', '%DIPLOMAT%')
                ->sum('sale_items.discount_amount');

            $otherDiscount = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->whereBetween('sales.created_at', [$from, $to])
                ->where('sales.status', 'completed')
                ->where('sale_items.discount_label', 'NOT LIKE', '%SENIOR%')
                ->where('sale_items.discount_label', 'NOT LIKE', '%PWD%')
                ->where('sale_items.discount_label', 'NOT LIKE', '%DIPLOMAT%')
                ->whereNotNull('sale_items.discount_label')
                ->where('sale_items.discount_label', '!=', '')
                ->sum('sale_items.discount_amount');

            $orderLevelOtherDiscount = DB::table('sales')
                ->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed')
                ->whereNotNull('discount_id')
                ->sum('discount_amount');

            return response()->json(array_merge($data, [
                'payment_breakdown'  => $paymentBreakdown,
                'vatable_sales'      => $vatableSales,
                'vat_amount'         => $vatAmount,
                'sc_discount'        => round((float)$scDiscount,       2),
                'pwd_discount'       => round((float)$pwdDiscount,      2),
                'diplomat_discount'  => round((float)$diplomatDiscount, 2),
                'other_discount'     => round((float)$otherDiscount + (float)$orderLevelOtherDiscount, 2), // ADD THIS
                'sc_pwd_discount'    => round((float)$scDiscount + (float)$pwdDiscount, 2),
                'total_senior_pax'   => 0,
                'total_pwd_pax'      => 0,
                'total_diplomat_pax' => 0,
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
                    sales.invoice_number                                                        as Invoice,
                    sales.total_amount                                                          as Amount,
                    sales.status                                                                as Status,
                    sales.created_at                                                            as Date_Time,
                    sales.payment_method                                                        as Method,
                    COALESCE(users.name, "N/A")                                                 as Cashier,
                    COALESCE(sales.vatable_sales, ROUND(sales.total_amount / 1.12, 2))          as Vatable,
                    COALESCE(sales.vat_amount, ROUND(sales.total_amount - (sales.total_amount / 1.12), 2)) as Tax,
                    0                                                                           as Disc_Pax,
                    (SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = sales.id)       as Items_Count
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