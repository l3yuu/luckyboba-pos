<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\RawMaterial;
use Illuminate\Http\Request;

class ItemCheckerController extends Controller
{
    // Search menu items by name
    public function search(Request $request)
    {
        $query = $request->query('query', '');

        $items = MenuItem::with('category')
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('barcode', 'LIKE', "%{$query}%");
            })
            ->limit(20)
            ->get()
            ->map(fn($item) => [
                'id'           => $item->id,
                'name'         => $item->name,
                'barcode'      => $item->barcode,
                'price'        => $item->price,
                'is_available' => $item->is_available ?? ($item->quantity > 0),
                'category'     => $item->category ? ['name' => $item->category->name] : null,
                'branch_stocks' => [], // extend if you have per-branch stock
            ]);

        return response()->json($items);
    }

    // Lookup menu item by barcode
    public function lookup($barcode)
    {
        $item = MenuItem::with('category')
            ->where('barcode', $barcode)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Item not found.'], 404);
        }

        return response()->json([
            'id'           => $item->id,
            'name'         => $item->name,
            'barcode'      => $item->barcode,
            'price'        => $item->price,
            'is_available' => $item->is_available ?? ($item->quantity > 0),
            'category'     => $item->category ? ['name' => $item->category->name] : null,
            'branch_stocks' => [],
        ]);
    }
}