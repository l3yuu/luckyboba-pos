<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class InventoryReportController extends Controller
{
    public function index()
    {
        // 1. Calculate Metrics
        $totalStockValue = MenuItem::sum(DB::raw('price * quantity'));
        $lowStockCount = MenuItem::where('quantity', '>', 0)->where('quantity', '<', 10)->count();
        $outOfStockCount = MenuItem::where('quantity', '<=', 0)->count();
        
        // Find top category based on item count
        $topCategory = Category::withCount('menuItems')
            ->orderBy('menu_items_count', 'desc')
            ->first();

        // 2. Get Critical Items (Low Stock)
        $criticalItems = MenuItem::where('quantity', '<', 10)
            ->with('category')
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->name,
                    'remaining' => $item->quantity,
                    'unitCost' => (float)$item->cost, // Using 'cost' column from your model
                    'potentialLoss' => $item->quantity * $item->cost
                ];
            });

        return response()->json([
            'metrics' => [
                ['label' => 'Total Stock Value', 'value' => '₱' . number_format($totalStockValue, 2), 'color' => 'text-[#3b2063]'],
                ['label' => 'Low Stock Items', 'value' => $lowStockCount, 'color' => 'text-red-500'],
                ['label' => 'Out of Stock', 'value' => $outOfStockCount, 'color' => 'text-zinc-400'],
                ['label' => 'Top Category', 'value' => $topCategory->name ?? 'N/A', 'color' => 'text-emerald-500'],
            ],
            'criticalItems' => $criticalItems
        ]);
    }
}