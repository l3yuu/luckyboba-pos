<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SubCategory;
use App\Traits\MenuCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    use MenuCache;

    public function index(Request $request)
    {
        $query = DB::table('categories')
            ->leftJoin('menu_items', 'categories.id', '=', 'menu_items.category_id')
            ->select(
                'categories.id',
                'categories.name',
                'categories.type',
                'categories.category_type',   // ✅ added
                'categories.sort_order',
                'categories.is_active',
                'categories.description',
                DB::raw('COUNT(menu_items.id) as menu_items_count')
            )
            ->groupBy(
                'categories.id', 'categories.name', 'categories.type',
                'categories.category_type',   // ✅ added
                'categories.sort_order', 'categories.is_active', 'categories.description'
            )
            ->orderBy('categories.sort_order', 'asc')
            ->orderBy('categories.name', 'asc');

        if ($request->has('type')) {
            $query->where('categories.type', $request->type);
        }

        if ($request->has('category_type')) {
            $query->where('categories.category_type', $request->category_type);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|unique:categories,name|max:255',
            'type'          => 'nullable|in:food,drink,promo,standard',
            'category_type' => 'nullable|in:food,drink,wings,waffle,combo,bundle,promo,mix_and_match,standard',
            'cup_id'        => 'nullable|exists:cups,id',
            'sort_order'    => 'nullable|integer',
            'is_active'     => 'nullable|boolean',
        ]);

        // ✅ Auto-derive category_type from type if not explicitly provided
        if (empty($validated['category_type'])) {
            $validated['category_type'] = match($validated['type'] ?? 'food') {
                'drink' => 'drink',
                'promo' => 'promo',
                default => 'food',
            };
        }

        try {
            DB::beginTransaction();

            $category = Category::create($validated);

            if (($validated['type'] ?? '') === 'drink' && !empty($validated['cup_id'])) {
                $cup = DB::table('cups')->where('id', $validated['cup_id'])->first();

                if ($cup) {
                    $subCategoryMap = [
                        'SM/SL'   => ['SM', 'SL'],
                        'JR'      => ['JR'],
                        'UM/UL'   => ['UM', 'UL'],
                        'PCM/PCL' => ['PCM', 'PCL'],
                    ];

                    $subNames   = $subCategoryMap[$cup->code] ?? [];
                    $firstSubId = null;

                    foreach ($subNames as $subName) {
                        $sub = SubCategory::create([
                            'name'        => $subName,
                            'category_id' => $category->id,
                            'cup_id'      => $cup->id,
                        ]);
                        if ($firstSubId === null) $firstSubId = $sub->id;
                    }

                    if ($firstSubId) {
                        $category->update(['sub_category_id' => $firstSubId]);
                    }
                }
            }

            DB::commit();
            $this->clearMenuCache();

            return response()->json(
                array_merge($category->fresh()->toArray(), ['menu_items_count' => 0]),
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Category Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to create category.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'          => 'sometimes|required|string|max:255|unique:categories,name,' . $id,
            'type'          => 'sometimes|nullable|in:food,drink,promo,standard',
             'category_type' => 'sometimes|nullable|in:food,drink,wings,waffle,combo,bundle,promo,mix_and_match,standard',
            'sort_order'    => 'sometimes|integer',
            'is_active'     => 'sometimes|boolean',
            'description'   => 'sometimes|nullable|string',
        ]);

        // ✅ If type changed but category_type wasn't explicitly sent, re-derive it
        if (isset($validated['type']) && !isset($validated['category_type'])) {
            $validated['category_type'] = match($validated['type']) {
                'drink' => 'drink',
                'promo' => 'promo',
                default => 'food',
            };
        }

        try {
            $category = Category::findOrFail($id);
            $category->update($validated);

            $this->clearMenuCache();

            return response()->json(
                array_merge($category->fresh()->toArray(), [
                    'menu_items_count' => DB::table('menu_items')
                        ->where('category_id', $id)->count(),
                ])
            );

        } catch (\Exception $e) {
            \Log::error("Category Update Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to update category.'], 500);
        }
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        // ✅ Guard: prevent deleting a category that still has menu items
        $hasItems = DB::table('menu_items')->where('category_id', $id)->exists();
        if ($hasItems) {
            return response()->json([
                'message' => 'Cannot delete a category that still has menu items. Remove or reassign them first.',
            ], 400);
        }

        $category->delete();
        $this->clearMenuCache();
        return response()->json(['success' => true, 'message' => 'Category deleted successfully']);
    }
}