<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubCategoryController extends Controller
{
    /**
     * Display a listing of sub-categories with item counts.
     */
public function index()
{
    try {
        $subCategories = SubCategory::with('category')
            ->withCount('menuItems')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($sub) {
                // Get all unique category names that have menu items using this sub-category
                $usedByCategories = \App\Models\MenuItem::where('sub_category_id', $sub->id)
                    ->with('category')
                    ->get()
                    ->pluck('category.name')
                    ->unique()
                    ->values()
                    ->toArray();

                return [
                    'id'             => $sub->id,
                    'name'           => $sub->name,
                    'mainCategory'   => $sub->category->name ?? 'N/A', // owner category
                    'usedBy'         => $usedByCategories,              // all categories using it
                    'itemCount'      => $sub->menu_items_count,
                ];
            });

        return response()->json($subCategories);
    } catch (\Exception $e) {
        Log::error("SubCategory Index Error: " . $e->getMessage());
        return response()->json(['message' => 'Error fetching data'], 500);
    }
}

    /**
     * Store a newly created sub-category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        try {
            $sub = SubCategory::create($validated);
            
            // Return the new object formatted for your React state
            return response()->json([
                'id' => $sub->id,
                'name' => $sub->name,
                'mainCategory' => $sub->category->name,
                'itemCount' => 0
            ], 201);
        } catch (\Exception $e) {
            Log::error("SubCategory Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Error saving sub category'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        // 1. Validation - Ensure category_id is valid
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sub_categories,name,' . $id,
            'category_id' => 'required|exists:categories,id',
        ]);

        try {
            $subCategory = SubCategory::findOrFail($id);
            
            $subCategory->update($validated);

            $subCategory->load('category');
            $subCategory->loadCount('menuItems');

            return response()->json([
                'id' => $subCategory->id,
                'name' => $subCategory->name,
                'mainCategory' => $subCategory->category->name ?? 'N/A',
                'itemCount' => $subCategory->menu_items_count,
            ]);
        } catch (\Exception $e) {
            \Log::error("SubCategory Update Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Remove the specified sub-category from storage.
     */
    public function destroy($id)
    {
        try {
            $subCategory = SubCategory::findOrFail($id);

            // OPTIONAL: Check if sub-category has linked menu items before deleting
            // This prevents data orphaned records in your 'Lucky Boba' menu
            if ($subCategory->menuItems()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete: This sub-category has linked menu items.'
                ], 422);
            }

            $subCategory->delete();

            return response()->json([
                'message' => 'Sub-category deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            Log::error("SubCategory Delete Error: " . $e->getMessage());
            return response()->json(['message' => 'Error deleting sub-category'], 500);
        }
    }
}