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
            'cashier_name' => 'nullable|string', // <-- ADDED: Allows frontend to send the name
        ]);

        // 1. EXTRACT USER DATA (Bulletproof Method)
        // Explicitly check the Sanctum guard to ensure the token is read properly
        $user = auth('sanctum')->user();
        
        // Prioritize frontend name, then database name, then fallback
        $cashierName = $request->input('cashier_name') ?? ($user ? $user->name : 'System Admin');
        $userId = $user ? $user->id : null;

        try {
            DB::beginTransaction();

            // 2. PRE-CALCULATIONS
            $chargeType = null;
            $totalQty = 0; 
            
            foreach ($validated['items'] as $item) {
                $totalQty += $item['quantity'];
                
                if (isset($item['charges'])) {
                    if ($item['charges']['grab'] ?? false) $chargeType = 'grab';
                    if ($item['charges']['panda'] ?? false) $chargeType = 'panda';
                }
            }

            // 3. CREATE THE MAIN SALE RECORD
            $todayCount = Sale::whereDate('created_at', now()->today())->count();
            $invoiceNumber = 'LB-' . date('Ymd') . '-' . str_pad($todayCount + 1, 4, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'user_id' => $userId,
                'total_amount' => $validated['total'],
                'invoice_number' => $invoiceNumber,
                'status' => 'completed',
                'payment_method' => 'cash',
                'charge_type' => $chargeType,
                'pax' => 1,
                'is_synced' => false,
            ]);

            // 4. CREATE SALE ITEMS AND DEDUCT INVENTORY
            foreach ($validated['items'] as $item) {
                
                // Logic to set the unit price to 135 for Large items in the DB
                $unitPrice = (float)$item['unit_price'];
                if (($item['size'] ?? null) === 'L') {
                    $unitPrice += 20;
                }

                SaleItem::create([
                    'sale_id' => $sale->id, 
                    'menu_item_id' => $item['menu_item_id'],
                    'product_name' => $item['name'],
                    'quantity' => $item['quantity'],
                    'price' => $unitPrice, 
                    'final_price' => $item['total_price'],
                    'size' => $item['size'] ?? null,
                    'sugar_level' => $item['sugar_level'] ?? null,
                    'options' => $item['options'] ?? null,
                    'add_ons' => $item['add_ons'] ?? null,
                ]);

                // Deduct from inventory
                $menuItem = MenuItem::find($item['menu_item_id']);
                if ($menuItem) {
                    $menuItem->decrement('quantity', $item['quantity']);
                }
            }

            // 5. CREATE RECEIPT WITH DYNAMIC CASHIER NAME
            Receipt::create([
                'si_number'    => $invoiceNumber,
                'terminal'     => '01',
                'items_count'  => $totalQty,
                'cashier_name' => $cashierName, // Now uses the correct name
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
                'cashier' => $cashierName
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
                    Log::warning("Inventory restore failed for sale #{$sale->invoice_number}: Item ID {$item->menu_item_id} not found.");
                }
            }

            // 1. Update Sale Table (This is the primary record)
            $sale->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->reason,
                'cancelled_at' => now(),
            ]);

            DB::commit();
            $this->dashboardService->clearTodayCache();

            return response()->json(['status' => 'success', 'message' => 'Voided successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}