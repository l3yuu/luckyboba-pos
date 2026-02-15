<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Receipt;
use App\Services\DashboardService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.size' => 'nullable|string',
            'items.*.sugar_level' => 'nullable|string',
            'items.*.options' => 'nullable|array',
            'items.*.add_ons' => 'nullable|array',
            'items.*.remarks' => 'nullable|string',
            'items.*.charges' => 'nullable|array',
            'subtotal' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $chargeType = null;
            $totalQty = 0; 
            foreach ($validated['items'] as $item) {
                $totalQty += $item['quantity'];
                if (isset($item['charges'])) {
                    if ($item['charges']['grab'] ?? false) $chargeType = 'grab';
                    if ($item['charges']['panda'] ?? false) $chargeType = 'panda';
                }
            }

            // --- GENERATE INVOICE NUMBER ---
            // LB-YYYYMMDD-000X
            $todayCount = Sale::whereDate('created_at', now()->today())->count();
            $invoiceNumber = 'LB-' . date('Ymd') . '-' . str_pad($todayCount + 1, 4, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'user_id' => auth()->id(),
                'total_amount' => $validated['total'],
                'invoice_number' => $invoiceNumber, // REQUIRED NOW
                'status' => 'completed',            // REQUIRED NOW
                'payment_method' => 'cash',
                'charge_type' => $chargeType,
                'pax' => 1,
                'is_synced' => false,
            ]);

            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'menu_item_id' => $item['menu_item_id'],
                    'product_name' => $item['name'],
                    'quantity' => $item['quantity'],
                    'price' => $item['unit_price'],
                    'final_price' => $item['total_price'],
                    'size' => $item['size'] ?? null,
                    'sugar_level' => $item['sugar_level'] ?? null,
                    'options' => $item['options'] ?? null,
                    'add_ons' => $item['add_ons'] ?? null,
                ]);
            }

            // For the Receipt, we use the same Invoice Number for consistency
            Receipt::create([
                'si_number'    => $invoiceNumber,
                'terminal'     => '01',
                'items_count'  => $totalQty,
                'cashier_name' => auth()->user()->name,
                'total_amount' => $validated['total'],
                'sale_id'      => $sale->id,
            ]);

            DB::commit();

            // Clear cache so the new sale appears on the dashboard immediately
            $this->dashboardService->clearTodayCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Sale and Receipt created successfully',
                'si_number' => $invoiceNumber,
                'sale'    => $sale->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale creation failed: ' . $e->getMessage());
            
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to create sale',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $sales = Sale::with('items', 'user')->latest()->paginate(20);
        return response()->json($sales);
    }
}