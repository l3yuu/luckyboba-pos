<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Receipt;
use App\Services\DashboardService;
use Illuminate\Support\Facades\DB;

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

            // Determine charge_type from items (grab/panda/null)
            $chargeType = null;
            $totalQty = 0; // Track for receipt summary
            foreach ($validated['items'] as $item) {
                $totalQty += $item['quantity'];
                if (isset($item['charges'])) {
                    if ($item['charges']['grab'] ?? false) {
                        $chargeType = 'grab';
                    }
                    if ($item['charges']['panda'] ?? false) {
                        $chargeType = 'panda';
                    }
                }
            }

            // Create the Sale record
            $sale = Sale::create([
                'user_id' => auth()->id(),
                'total_amount' => $validated['total'],
                'payment_method' => 'cash',
                'charge_type' => $chargeType,
                'pax' => 1,
                'is_synced' => false,
            ]);

            // Create the SaleItems records
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

            // Create the Receipt record
            // Generates format: SI-20260213-0001
            $siNumber = 'SI-' . date('Ymd') . '-' . str_pad($sale->id, 4, '0', STR_PAD_LEFT);

            Receipt::create([
                'si_number'    => $siNumber,
                'terminal'     => '01', // Standardized terminal ID
                'items_count'  => $totalQty,
                'cashier_name' => auth()->user()->name,
                'total_amount' => $validated['total'],
                'sale_id'      => $sale->id,
            ]);

            DB::commit();

            // Clear dashboard cache after successful sale
            $this->dashboardService->clearTodayCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Sale and Receipt created successfully',
                'si_number' => $siNumber,
                'sale'    => $sale->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Sale creation failed: ' . $e->getMessage());
            
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to create sale',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
    
    public function index()
    {
        $sales = Sale::with('items', 'user')
            ->latest()
            ->paginate(20);
        return response()->json($sales);
    }

    public function show($id)
    {
        $sale = Sale::with('items', 'user')->findOrFail($id);
        return response()->json($sale);
    }
}