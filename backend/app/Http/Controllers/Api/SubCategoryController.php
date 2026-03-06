<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SubCategoryController extends Controller
{
    /**
     * Display a listing of sub-categories with item counts.
     */
    public function index(Request $request)
    {
        $query = DB::table('sub_categories')
            ->leftJoin('categories', 'sub_categories.category_id', '=', 'categories.id')
            ->leftJoin('menu_items', 'sub_categories.id', '=', 'menu_items.sub_category_id')
            ->select(
                'sub_categories.id',
                'sub_categories.name',
                'categories.name as mainCategory',
                DB::raw('COUNT(menu_items.id) as itemCount')
            )
            ->groupBy('sub_categories.id', 'sub_categories.name', 'categories.name');

        if ($request->has('category_id')) {
            $query->where('sub_categories.category_id', $request->category_id);
        }

        return response()->json($query->get());
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

            Cache::forget('menu_data_v3');
            
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

            Cache::forget('menu_data_v3');

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

            Cache::forget('menu_data_v3');

            return response()->json([
                'message' => 'Sub-category deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            Log::error("SubCategory Delete Error: " . $e->getMessage());
            return response()->json(['message' => 'Error deleting sub-category'], 500);
        }
    }
}