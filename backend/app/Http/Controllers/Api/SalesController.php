<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\DashboardService;
use Illuminate\Http\Request;
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

            $todayCount = Sale::whereDate('created_at', now()->today())->count();
            $invoiceNumber = 'LB-' . date('Ymd') . '-' . str_pad($todayCount + 1, 4, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'user_id' => auth()->id(),
                'total_amount' => $validated['total'],
                'invoice_number' => $invoiceNumber,
                'status' => 'completed',
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

                // --- NEW: DEDUCT FROM INVENTORY ---
                $menuItem = MenuItem::find($item['menu_item_id']);
                if ($menuItem) {
                    $menuItem->decrement('quantity', $item['quantity']);
                }
            }

            Receipt::create([
                'si_number'    => $invoiceNumber,
                'terminal'     => '01',
                'items_count'  => $totalQty,
                'cashier_name' => auth()->user()->name,
                'total_amount' => $validated['total'],
                'sale_id'      => $sale->id,
            ]);

            DB::commit();

            $this->dashboardService->clearTodayCache();

            return response()->json([
                'status'  => 'success',
                'message' => 'Sale created and stock deducted',
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

    // index() and cancel() remain the same
    public function index()
    {
        $sales = Sale::with('items', 'user')->latest()->paginate(20);
        return response()->json($sales);
    }

public function cancel(Request $request, $id)
{
    $request->validate([
        'reason' => 'required|string|max:255'
    ]);

    try {
        DB::beginTransaction();

        $sale = Sale::with('items')->findOrFail($id);

        if ($sale->status === 'cancelled') {
            return response()->json(['message' => 'Sale already cancelled'], 400);
        }

        foreach ($sale->items as $item) {
            $menuItem = MenuItem::find($item->menu_item_id);
            if ($menuItem) {
                $menuItem->increment('quantity', $item->quantity);
            } else {
                // Optional: Log if a menu item no longer exists
                Log::warning("Inventory restore failed for sale #{$sale->invoice_number}: Item ID {$item->menu_item_id} not found.");
            }
        }

        // 1. Update Sale Table (This is the primary record)
        $sale->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->reason,
            'cancelled_at' => now(),
        ]);

        // 2. REMOVE OR COMMENT OUT THIS BLOCK:
        // DB::table('receipts')->where('sale_id', $id)->update(['status' => 'cancelled']);

        DB::commit();
        $this->dashboardService->clearTodayCache();

        return response()->json(['status' => 'success', 'message' => 'Voided successfully']);
    } catch (\Exception $e) {
        DB::rollBack();
        // This will help you see the REAL error in your console
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}
}