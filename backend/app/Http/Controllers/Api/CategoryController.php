<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // Fetch all categories with a count of related menu items
    public function index()
    {
        $categories = Category::withCount('menu_items')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($categories);
    }

    // Store a new category
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:categories,name|max:255',
            'description' => 'nullable|string',
        ]);

        $category = Category::create($validated);

        // Load item count (which will be 0) to match frontend structure
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
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'description' => 'nullable|string',
        ]);

        try {
            $category = Category::findOrFail($id);
            $category->update($validated);

            // This ensures the frontend table still sees the number of items
            // instead of a blank space or NaN.
            $category->loadCount('menu_items');

            return response()->json($category);
        } catch (\Exception $e) {
            // Log the error for OJT debugging if needed
            \Log::error("Category Update Error: " . $e->getMessage());

            return response()->json([
                'message' => 'Failed to update category. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}