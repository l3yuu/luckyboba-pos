<?php

namespace App\Http\Controllers;

use App\Models\CategoryDrink;
use Illuminate\Http\Request;

class CategoryDrinkController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
        ]);

        $drinks = CategoryDrink::with('menuItem')
            ->where('category_id', $request->category_id)
            ->whereHas('menuItem', function($q) {
                $q->where('status', 'active');
            })
            ->get()
            ->map(fn($d) => [
                'id'           => $d->id,
                'category_id'  => $d->category_id,
                'menu_item_id' => $d->menu_item_id,
                'name'         => $d->menuItem->name ?? '—',
                'size'         => $d->size,
                'price'        => $d->menuItem->price ?? 0,
            ]);

        return response()->json(['success' => true, 'data' => $drinks]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id'             => 'required|exists:categories,id',
            'drinks'                  => 'required|array',
            'drinks.*.menu_item_id'   => 'required|exists:menu_items,id',
            'drinks.*.size'           => 'nullable|string|max:10',
        ]);

        // Replace entire drink pool for this category
        CategoryDrink::where('category_id', $request->category_id)->delete();

        foreach ($request->drinks as $d) {
            CategoryDrink::create([
                'category_id'  => $request->category_id,
                'menu_item_id' => $d['menu_item_id'],
                'size'         => $d['size'] ?? 'M',
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Drink pool updated.']);
    }
}