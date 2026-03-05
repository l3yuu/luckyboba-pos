<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    // Fetch all categories with a count of related menu items
    public function index(Request $request)
    {
        $query = DB::table('categories')
            ->leftJoin('menu_items', 'categories.id', '=', 'menu_items.category_id')
            ->select(
                'categories.id',
                'categories.name',
                'categories.type',
                'categories.description',
                DB::raw('COUNT(menu_items.id) as menu_items_count')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.type', 'categories.description');

        if ($request->has('type')) {
            $query->where('categories.type', $request->type);
        }

        return response()->json($query->get());
    }

    // Store a new category
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|unique:categories,name|max:255',
            'type'        => 'required|in:food,drink,promo,standard',
            'cup_id'      => 'nullable|exists:cups,id',
        ]);

        $category = Category::create($validated);
        $category->menu_items_count = 0;

        return response()->json($category, 201);
    }

    // Delete a category
    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        // Check if category has items before deleting (Optional safety)
        if($category->menu_items()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with active items.'], 422);
        }

        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:categories,name,' . $id,
            'type'        => 'nullable|in:food,drink,promo,standard',
            'cup_id'      => 'nullable|exists:cups,id',
        ]);

        try {
            $category = Category::findOrFail($id);
            $category->update($validated);
            $category->loadCount('menu_items');

            return response()->json($category);
        } catch (\Exception $e) {
            \Log::error("Category Update Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to update category.'], 500);
        }
    }
}