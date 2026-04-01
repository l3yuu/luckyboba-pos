<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\SalesDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

            return response()->json(
                $this->salesService->getAnalyticsData($branchId)
            );
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

        $saleSubtotalSql = '(SELECT SUM(si2.final_price * si2.quantity) FROM sale_items si2 WHERE si2.sale_id = sales.id)';

        $proratedAmount = "SUM(
            sale_items.final_price * sale_items.quantity
            * (sales.total_amount / NULLIF({$saleSubtotalSql}, 0))
        )";

        if ($type === 'category-summary') {
            $items = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
                ->where('sales.status', 'completed')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    DB::raw("COALESCE(categories.name, 'Uncategorized') as name"),
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    DB::raw("'' as category"),
                    DB::raw("{$proratedAmount} as amount")
                )
                ->groupBy('categories.name')
                ->orderByDesc('amount')
                ->get();
        } else {
            $items = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->leftJoin('menu_items', 'sale_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->whereBetween('sales.created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
                ->where('sales.status', 'completed')
                ->when($branchId, fn($q) => $q->where('sales.branch_id', $branchId))
                ->select(
                    'sale_items.product_name as name',
                    DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    DB::raw("{$proratedAmount} as amount")
                )
                ->groupBy('sale_items.product_name', 'categories.name')
                ->orderByDesc('amount')
                ->get();
        }

        return response()->json([
            'items'        => $items,
            'total_qty'    => $items->sum('qty'),
            'grand_total'  => round((float) $items->sum('amount'), 2),
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

            $report                = $this->salesService->getXReading($request->date, null, $branchId);
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

            $report                = $this->salesService->generateZReading($from, $to, $branchId);
            $report['prepared_by'] = $user?->name ?? 'System Admin';

            $zRecord = \App\Models\ZReading::where('reading_date', $from)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->first();

            $branch = \App\Models\Branch::find($branchId);

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

            $today     = now()->toDateString();
            $weekStart = now()->startOfWeek()->toDateString();
            $weekEnd   = now()->endOfWeek()->toDateString();

            $weeklySales = \App\Models\Sale::selectRaw('DATE(created_at) as date, SUM(total_amount) as value')
                ->whereBetween('created_at', [$weekStart . ' 00:00:00', $weekEnd . ' 23:59:59'])
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->map(fn($row) => [
                    'day'       => \Carbon\Carbon::parse($row->date)->format('D'),
                    'date'      => \Carbon\Carbon::parse($row->date)->format('M d'),
                    'value'     => (float) $row->value,
                    'full_date' => $row->date,
                ]);

            $todaySales = \App\Models\Sale::selectRaw('HOUR(created_at) as hour, SUM(total_amount) as value')
                ->whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupByRaw('HOUR(created_at)')
                ->orderBy('hour')
                ->get()
                ->map(fn($row) => [
                    'time'  => \Carbon\Carbon::createFromTime($row->hour)->format('g A'),
                    'value' => (float) $row->value,
                ]);

            $beginning = \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->orderBy('id')->first();

            $ending = \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->orderBy('id', 'desc')->first();

            $todayTotal = (float) \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_amount');

            $cancelledTotal = (float) \App\Models\Sale::whereDate('created_at', $today)
                ->where('status', 'cancelled')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('total_amount');

            return response()->json([
                'success' => true,
                'data'    => [
                    'weekly_sales' => [
                        'data'               => $weeklySales,
                        'total_revenue'      => $weeklySales->sum('value'),
                        'start_date'         => \Carbon\Carbon::parse($weekStart)->format('M d, Y'),
                        'end_date'           => \Carbon\Carbon::parse($weekEnd)->format('M d, Y'),
                        'current_week_start' => $weekStart,
                    ],
                    'today_sales' => [
                        'data' => $todaySales,
                        'date' => $today,
                    ],
                    'statistics' => [
                        'beginning_sales' => 0,
                        'today_sales'     => $todayTotal,
                        'ending_sales'    => $todayTotal,
                        'cancelled_sales' => $cancelledTotal,
                        'beginning_or'    => $beginning?->invoice_number ?? '00000',
                        'ending_or'       => $ending?->invoice_number    ?? '00000',
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard Data Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/reports/z-reading-history
     */
    public function zReadingHistory(Request $request)
{
    try {
        $branchId = $request->branch_id;

        $history = DB::table('z_readings')
            ->join('branches', 'z_readings.branch_id', '=', 'branches.id')
            ->select(
                'z_readings.id',
                'z_readings.reading_date as date',
                'branches.name as branch_name',
                'z_readings.total_sales as gross',
                'z_readings.net_sales as net',
                'z_readings.is_closed',
                'z_readings.closed_at',
                'z_readings.branch_id'
            )
            ->when($branchId, fn($q) => $q->where('z_readings.branch_id', $branchId))
            ->orderByDesc('z_readings.reading_date')
            ->limit(50)
            ->get()
            ->map(function ($row) {
                $orders = DB::table('sales')
                    ->whereDate('created_at', $row->date)
                    ->where('branch_id', $row->branch_id)
                    ->where('status', 'completed')
                    ->count();

                $row->total_orders = $orders;
                $row->gross        = (float) $row->gross;
                $row->net          = (float) $row->net;
                unset($row->branch_id);
                return $row;
            });

        return response()->json(['success' => true, 'data' => $history]);

    } catch (\Exception $e) {
        Log::error('Z Reading History Error: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    /**
     * POST /api/readings/z/print-token
     * Generates a short-lived one-time token so window.open() can call zReadingPrint
     * without needing an Authorization header (which browsers can't send via window.open).
     */
    public function zReadingPrintToken(Request $request): JsonResponse
{
    $request->validate([
        'branch_id' => 'required|integer',
        'date'      => 'required|date',
    ]);

    $token    = \Illuminate\Support\Str::random(48);
    $cacheKey = 'z_print_token_' . $request->branch_id . '_' . $request->date;

    \Illuminate\Support\Facades\Cache::put($cacheKey, $token, now()->addMinutes(5));

    return response()->json(['token' => $token]);
}

    /**
     * POST /api/readings/z/close
     */
    public function zReadingClose(Request $request): JsonResponse
{
    $request->validate([
        'branch_id' => 'required|integer',
        'date'      => 'required|date',
    ]);

    $branchId    = (int) $request->branch_id;
    $date        = $request->date;
    $user        = auth('sanctum')->user() ?? $request->user();
    $isSuperAdmin = $user?->role === 'super_admin' || $user?->role === 'admin';

    if (!$isSuperAdmin && (int) $user?->branch_id !== $branchId) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. You can only close shifts for your own branch.',
        ], 403);
    }

        $z = \App\Models\ZReading::where('reading_date', $date)
                ->where('branch_id', $branchId)
                ->first();

        if (!$z) {
            $this->salesService->generateZReading($date, $date, $branchId);
            $z = \App\Models\ZReading::where('reading_date', $date)
                    ->where('branch_id', $branchId)
                    ->first();
        }

        if (!$z) {
            return response()->json([
                'success' => false,
                'message' => 'No Z Reading record found for this date.',
            ], 404);
        }

        if ($z->is_closed) {
            return response()->json([
                'success' => false,
                'message' => 'Shift is already closed.',
            ], 422);
        }

        $z->is_closed = true;
        $z->closed_at = now();
        $z->save();

        return response()->json(['success' => true, 'message' => 'Shift closed successfully.']);
    }

    /**
     * GET /api/readings/z/print?branch_id=&date=&token=
     * Public endpoint — authenticated via one-time print token instead of Sanctum header.
     */
    public function zReadingPrint(Request $request)
{
    $request->validate([
        'branch_id' => 'required|integer',
        'date'      => 'required|date',
        'token'     => 'required|string',
    ]);

    // ── Verify one-time print token (cache-based) ─────────────────────────
    $cacheKey    = 'z_print_token_' . $request->branch_id . '_' . $request->date;
    $storedToken = \Illuminate\Support\Facades\Cache::get($cacheKey);

    if (! $storedToken || $storedToken !== $request->token) {
        abort(403, 'Invalid or expired print token.');
    }

    // Invalidate immediately — one-time use only
    \Illuminate\Support\Facades\Cache::forget($cacheKey);
    // ─────────────────────────────────────────────────────────────────────

    $branchId = (int) $request->branch_id;
    $date     = $request->date;

    $data    = $this->salesService->generateZReading($date, $date, $branchId);
    $branch  = \App\Models\Branch::find($branchId);
    $zRecord = \App\Models\ZReading::where('reading_date', $date)
                   ->where('branch_id', $branchId)
                   ->first();

    $fmt = fn($v) => '₱' . number_format((float) $v, 2);
    $pay = collect($data['payment_breakdown']);

    $gcash = $pay->where('method', 'gcash')->sum('amount');
    $visa  = $pay->whereIn('method', ['visa', 'visa card'])->sum('amount');
    $mc    = $pay->whereIn('method', ['mastercard', 'master card', 'master'])->sum('amount');
    $grab  = $pay->whereIn('method', ['grab', 'grabfood', 'grab food'])->sum('amount');
    $panda = $pay->whereIn('method', ['food panda', 'foodpanda'])->sum('amount');

    $isClosed   = ($zRecord?->is_closed) ? '★  SHIFT CLOSED  ★' : 'SHIFT OPEN';
    $branchName = $branch?->name ?? "Branch #{$branchId}";
    $branchAddr = $branch?->address ?? '';
    $branchTin  = $branch?->tin ?? '';
    $zCounter   = $data['z_counter'];
    $genAt      = $data['generated_at'];
    $begSI      = $data['beg_si'];
    $endSI      = $data['end_si'];
    $txCount    = $data['transaction_count'];

    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Z Reading — {$date}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; font-size:11px; color:#000;
           max-width:320px; margin:0 auto; padding:16px 8px; }
    .c  { text-align:center; }
    .b  { font-weight:bold; }
    .lg { font-size:14px; }
    hr  { border:none; border-top:1px dashed #000; margin:6px 0; }
    .r  { display:flex; justify-content:space-between; padding:2px 0; }
    .rt { font-weight:bold; border-top:1px solid #000; margin-top:4px; padding-top:4px; }
    .badge { display:inline-block; border:1px solid #000; padding:2px 8px;
             font-size:10px; margin-top:4px; }
  </style>
</head>
<body>
  <p class="c b lg">LUCKY BOBA</p>
  <p class="c">{$branchName}</p>
  <p class="c">{$branchAddr}</p>
  <p class="c">VAT Reg TIN: {$branchTin}</p>
  <hr>
  <p class="c b">** Z READING **</p>
  <p class="c">Z Counter No.: {$zCounter}</p>
  <hr>
  <div class="r"><span>Date</span><span>{$date}</span></div>
  <div class="r"><span>Generated</span><span>{$genAt}</span></div>
  <div class="r"><span>Beg. SI#</span><span>{$begSI}</span></div>
  <div class="r"><span>End SI#</span><span>{$endSI}</span></div>
  <div class="r"><span>Transactions</span><span>{$txCount}</span></div>
  <hr>
  <p class="b">SALES SUMMARY</p>
  <div class="r"><span>Gross Sales</span><span>{$fmt($data['gross_sales'])}</span></div>
  <div class="r"><span>  Less: Discounts</span><span>({$fmt($data['total_discounts'])})</span></div>
  <div class="r"><span>  Less: Voids</span><span>({$fmt($data['total_void_amount'])})</span></div>
  <div class="r rt"><span>Net Sales</span><span>{$fmt($data['net_sales'])}</span></div>
  <hr>
  <p class="b">VAT BREAKDOWN</p>
  <div class="r"><span>Vatable Sales</span><span>{$fmt($data['vatable_sales'])}</span></div>
  <div class="r"><span>VAT Amount (12%)</span><span>{$fmt($data['vat_amount'])}</span></div>
  <div class="r"><span>VAT-Exempt Sales</span><span>{$fmt($data['vat_exempt_sales'])}</span></div>
  <hr>
  <p class="b">DISCOUNTS</p>
  <div class="r"><span>Senior Citizen</span><span>{$fmt($data['sc_discount'])}</span></div>
  <div class="r"><span>PWD</span><span>{$fmt($data['pwd_discount'])}</span></div>
  <div class="r"><span>Diplomat</span><span>{$fmt($data['diplomat_discount'])}</span></div>
  <div class="r"><span>Others</span><span>{$fmt($data['other_discount'])}</span></div>
  <div class="r rt"><span>Total Discounts</span><span>{$fmt($data['total_discounts'])}</span></div>
  <hr>
  <p class="b">PAYMENT METHODS</p>
  <div class="r"><span>Cash</span><span>{$fmt($data['cash_total'])}</span></div>
  <div class="r"><span>GCash</span><span>{$fmt($gcash)}</span></div>
  <div class="r"><span>Visa</span><span>{$fmt($visa)}</span></div>
  <div class="r"><span>Mastercard</span><span>{$fmt($mc)}</span></div>
  <div class="r"><span>GrabFood</span><span>{$fmt($grab)}</span></div>
  <div class="r"><span>FoodPanda</span><span>{$fmt($panda)}</span></div>
  <div class="r rt"><span>Total Payments</span><span>{$fmt($data['total_payments'])}</span></div>
  <hr>
  <p class="b">CASH POSITION</p>
  <div class="r"><span>Cash In (Fund)</span><span>{$fmt($data['cash_in'])}</span></div>
  <div class="r"><span>Cash Drop</span><span>({$fmt($data['cash_drop'])})</span></div>
  <div class="r rt"><span>Cash In Drawer</span><span>{$fmt($data['cash_in_drawer'])}</span></div>
  <hr>
  <p class="b">ACCUMULATED SALES</p>
  <div class="r"><span>Previous Accum.</span><span>{$fmt($data['previous_accumulated'])}</span></div>
  <div class="r"><span>Sales for the Day</span><span>{$fmt($data['sales_for_the_day'])}</span></div>
  <div class="r rt"><span>Present Accum.</span><span>{$fmt($data['present_accumulated'])}</span></div>
  <hr>
  <p class="c" style="margin-top:8px"><span class="badge">{$isClosed}</span></p>
  <p class="c" style="margin-top:12px;font-size:10px">
    This document serves as your official Z Reading.<br>Printed: {$genAt}
  </p>
  <script>window.onload = () => window.print();</script>
</body>
</html>
HTML;

    return response($html)->header('Content-Type', 'text/html');
}
}