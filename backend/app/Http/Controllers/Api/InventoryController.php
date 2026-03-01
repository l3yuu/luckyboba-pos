<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
/**
     * Get all items for the inventory list from menu_items.
     */
    public function index()
    {
        try {
            // Join menu_items with categories to filter by category type
            $items = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
                ->select(
                    'menu_items.id', 
                    'menu_items.name', 
                    'menu_items.barcode', 
                    'menu_items.quantity'
                )
                // Only show items where category type is 'drink', 'wings', etc.
                // Exclude 'standard' which contains non-stock items like discounts
                ->where('categories.type', '!=', 'standard') 
                ->orderBy('menu_items.name', 'asc')
                ->get();

            return response()->json($items);
        } catch (\Exception $e) {
            Log::error("Inventory Index Error: " . $e->getMessage());
            return response()->json(['error' => 'Database Error: Check Laravel logs'], 500);
        }
    }

    /**
     * Store a new item directly into menu_items.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'quantity'    => 'required|integer|min:0',
            'price'       => 'required|numeric|min:0',
            'cost'        => 'required|numeric|min:0',
            'barcode'     => 'nullable|string|unique:menu_items,barcode',
        ]);

        try {
            DB::beginTransaction();

            $item = MenuItem::create($validated);

            // Log the initial stock creation in stock_transactions
            StockTransaction::create([
                'menu_item_id'    => $item->id,
                'quantity_change' => $validated['quantity'],
                'type'            => 'restock',
                'remarks'         => 'Initial stock creation via Inventory Dashboard'
            ]);

            DB::commit();
            return response()->json($item, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Inventory Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Error creating item'], 500);
        }
    }

    public function updateQuantity(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer'
        ]);

        // Use a transaction to ensure both updates happen together
        return DB::transaction(function () use ($request, $id) {
            $item = MenuItem::findOrFail($id);
            
            // 1. Update the actual stock level in the menu_items table
            // This adds the incoming quantity (e.g., +10) to the current total
            $item->quantity += $request->quantity;
            $item->save();

            // 2. Create the audit trail in stock_transactions
            // This matches the schema shown in your database
            StockTransaction::create([
                'menu_item_id'    => $id,
                'quantity_change' => $request->quantity,
                'type'            => $request->quantity > 0 ? 'restock' : 'adjustment',
                'remarks'         => 'Manual restock via Inventory Dashboard'
            ]);

            return response()->json([
                'message'   => 'Stock updated and transaction logged successfully',
                'new_total' => $item->quantity
            ]);
        });
    }

    public function getStockAlerts()
    {
        try {
            // Fetch items that are out of stock or low (below 5)
            $alerts = MenuItem::where('quantity', '<=', 5)
                ->select('id', 'name', 'quantity')
                ->orderBy('quantity', 'asc')
                ->get();

            return response()->json([
                'count' => $alerts->count(),
                'items' => $alerts
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

public function getCategories()
{
    try {
        // Fetch categories that are not 'standard' type
        // This hides categories for discounts, cards, and freebies from your inventory forms.
        $categories = \App\Models\Category::select('id', 'name')
            ->where('type', '!=', 'standard')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($categories);
    } catch (\Exception $e) {
        \Log::error("Fetch Categories Error: " . $e->getMessage());
        return response()->json(['error' => 'Failed to load valid categories'], 500);
    }
}

    public function checkByBarcode($barcode)
    {
        try {
            $item = \App\Models\MenuItem::where('barcode', $barcode)->first();

            if (!$item) {
                return response()->json(['message' => 'Item not found'], 404);
            }

            return response()->json($item);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function getTransactionHistory()
    {
        try {
            $history = DB::table('stock_transactions')
                ->join('menu_items', 'stock_transactions.menu_item_id', '=', 'menu_items.id')
                ->select(
                    'stock_transactions.id',
                    'menu_items.name as product_name',
                    'stock_transactions.quantity_change',
                    'stock_transactions.type',
                    'stock_transactions.remarks',
                    'stock_transactions.created_at'
                )
                ->orderBy('stock_transactions.created_at', 'desc')
                ->get();

            return response()->json($history);
        } catch (\Exception $e) {
            Log::error("Fetch History Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch transaction history'], 500);
        }
    }
}