<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\StockTransaction;

class InventoryController extends Controller
{
    /**
     * Get all items for the inventory list.
     */
    public function index()
    {
        try {
            $items = MenuItem::select('id', 'name', 'barcode', 'quantity')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json($items);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateQuantity(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer'
        ]);

        return DB::transaction(function () use ($request, $id) {
            $item = MenuItem::findOrFail($id);
            
            // 1. Update the actual stock
            $item->quantity += $request->quantity;
            $item->save();

            // 2. Create the audit trail
            StockTransaction::create([
                'menu_item_id' => $id,
                'quantity_change' => $request->quantity,
                'type' => 'restock',
                'remarks' => 'Manual restock via Inventory Dashboard'
            ]);

            return response()->json([
                'message' => 'Stock updated and transaction logged',
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'barcode' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'category_id' => 'required|integer'
        ]);

        try {
            $item = \App\Models\MenuItem::create($validated);
            
            // Log the initial stock as a transaction
            if ($item->quantity > 0) {
                \App\Models\StockTransaction::create([
                    'menu_item_id' => $item->id,
                    'quantity_change' => $item->quantity,
                    'type' => 'restock',
                    'remarks' => 'Initial stock entry'
                ]);
            }

            return response()->json($item, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getCategories()
    {
        try {
            // Fetch categories from your categories table
            $categories = \App\Models\Category::select('id', 'name')->get();
            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
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
}