<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use App\Traits\MenuCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SubCategoryController extends Controller
{
    use MenuCache;

    public function index(Request $request)
    {
        $query = DB::table('sub_categories')
            ->leftJoin('categories', 'sub_categories.category_id', '=', 'categories.id')
            ->leftJoin('menu_items', 'sub_categories.id', '=', 'menu_items.sub_category_id')
            ->select(
                'sub_categories.id',
                'sub_categories.name',
                'sub_categories.category_id',        // ← was missing
                'sub_categories.is_active',          // ← was missing
                'sub_categories.sort_order',         // ← was missing (if column exists)
                'categories.name as mainCategory',
                DB::raw('COUNT(menu_items.id) as itemCount')
            )
            ->groupBy(
                'sub_categories.id',
                'sub_categories.name',
                'sub_categories.category_id',
                'sub_categories.is_active',
                'sub_categories.sort_order',
                'categories.name'
            );

        if ($request->has('category_id')) {
            $query->where('sub_categories.category_id', $request->category_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'is_active'   => 'nullable|boolean',
            'sort_order'  => 'nullable|integer',
        ]);

        try {
            $sub = SubCategory::create($validated);
            $this->clearMenuCache();

            return response()->json([
                'id'          => $sub->id,
                'name'        => $sub->name,
                'category_id' => $sub->category_id,
                'mainCategory'=> $sub->category->name ?? 'N/A',
                'itemCount'   => 0,
                'is_active'   => $sub->is_active,
                'sort_order'  => $sub->sort_order ?? 0,
            ], 201);
        } catch (\Exception $e) {
            Log::error("SubCategory Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Error saving sub category'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255|unique:sub_categories,name,' . $id,
            'category_id' => 'sometimes|required|exists:categories,id',
            'is_active'   => 'sometimes|boolean',
            'sort_order'  => 'sometimes|integer',
        ]);

        try {
            $subCategory = SubCategory::findOrFail($id);
            $subCategory->update($validated);
            $subCategory->load('category');
            $subCategory->loadCount('menuItems');

            $this->clearMenuCache();

            return response()->json([
                'id'          => $subCategory->id,
                'name'        => $subCategory->name,
                'category_id' => $subCategory->category_id,
                'mainCategory'=> $subCategory->category->name ?? 'N/A',
                'itemCount'   => $subCategory->menu_items_count,
                'is_active'   => $subCategory->is_active,
                'sort_order'  => $subCategory->sort_order ?? 0,
            ]);
        } catch (\Exception $e) {
            \Log::error("SubCategory Update Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $subCategory = SubCategory::findOrFail($id);

            if ($subCategory->menuItems()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete: This sub-category has linked menu items.'
                ], 422);
            }

            $subCategory->delete();
            $this->clearMenuCache();

            return response()->json(['message' => 'Sub-category deleted successfully'], 200);

        } catch (\Exception $e) {
            Log::error("SubCategory Delete Error: " . $e->getMessage());
            return response()->json(['message' => 'Error deleting sub-category'], 500);
        }
    }
}