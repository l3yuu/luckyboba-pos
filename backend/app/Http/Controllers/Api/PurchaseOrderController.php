<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        try {
            $orders = PurchaseOrder::orderBy('date_ordered', 'desc')->get();
            
            $stats = [
                'active_orders' => PurchaseOrder::where('status', 'Pending')->count(),
                'pending_payment' => (float) PurchaseOrder::where('status', 'Pending')->sum('total_amount'),
                'monthly_spend' => (float) PurchaseOrder::whereMonth('date_ordered', Carbon::now()->month)
                                    ->where('status', 'Received')
                                    ->sum('total_amount'),
            ];

            return response()->json([
                'orders' => $orders,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a new Purchase Order
     */
    public function store(Request $request)
    {
        // Add transaction to ensure PO and its items are saved safely
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'supplier' => 'required|string',
                'total_amount' => 'required|numeric',
                'date_ordered' => 'required|date',
                'items' => 'required|array', // NEW validation for items
                'items.*.menu_item_id' => 'required|exists:menu_items,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_cost' => 'required|numeric|min:0',
            ]);

            // Auto-generate PO Number
            $count = PurchaseOrder::whereYear('created_at', date('Y'))->count() + 1;
            $poNumber = "PO-" . date('Y') . "-" . str_pad($count, 3, '0', STR_PAD_LEFT);

            // 1. Save the main Purchase Order record
            $order = PurchaseOrder::create([
                'supplier' => $validated['supplier'],
                'total_amount' => $validated['total_amount'],
                'date_ordered' => $validated['date_ordered'],
                'po_number' => $poNumber,
                'status' => 'Pending'
            ]);

            // 2. Save all items linked to this order
            foreach ($validated['items'] as $item) {
                \App\Models\PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'menu_item_id' => $item['menu_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                ]);
            }

            DB::commit();

            return response()->json($order, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("PO Store Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to create Purchase Order'], 500);
        }
    }

    /**
     * UPDATE STATUS FUNCTION
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Received,Cancelled'
        ]);

        try {
            DB::beginTransaction(); // Start safe transaction

            $po = PurchaseOrder::with('items')->findOrFail($id);
            $oldStatus = $po->status;
            $newStatus = $validated['status'];

            // AUTO-RESTOCK & AUTO-EXPENSE LOGIC
            if ($newStatus === 'Received' && $oldStatus !== 'Received') {
                
                // 1. Auto-Restock Items (from our previous step)
                foreach ($po->items as $poItem) {
                    $menuItem = \App\Models\MenuItem::find($poItem->menu_item_id);
                    if ($menuItem) {
                        $menuItem->quantity += $poItem->quantity;
                        $menuItem->save();

                        \App\Models\StockTransaction::create([
                            'menu_item_id' => $menuItem->id,
                            'quantity_change' => $poItem->quantity,
                            'type' => 'restock',
                            'remarks' => 'Auto-restocked via PO: ' . $po->po_number
                        ]);
                    }
                }

                // 2. NEW: Auto-Create Expense Record
                \App\Models\Expense::create([
                    'ref_num' => $po->po_number, // Use PO number as Ref Num
                    'description' => 'Supplier Payment: ' . $po->supplier,
                    'date' => now()->toDateString(),
                    'category' => 'Inventory Purchase', // Or 'Supplier', based on your needs
                    'amount' => $po->total_amount,
                ]);
            }

            // Update the PO status
            $po->status = $newStatus;
            $po->save();

            DB::commit(); // Save all changes safely

            return response()->json([
                'message' => 'Status updated, stock adjusted, and expense recorded.', 
                'po' => $po
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("PO Status Update Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to process PO update'], 500);
        }
    }
}