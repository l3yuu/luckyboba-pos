<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\MenuCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MenuListController extends Controller
{
    use MenuCache;
    public function index()
    {
        try {
            $items = DB::table('menu_items')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->select(
                    'menu_items.id',
                    'menu_items.name as name',
                    'menu_items.barcode',
                    'menu_items.price as price',
                    'menu_items.price as sellingPrice',
                    'menu_items.size',
                    'menu_items.cost as unitCost',        // ← 'cost' not 'unit_cost'
                    DB::raw('0.00 as totalCost'),
                    'menu_items.status',
                    'menu_items.type',
                    'categories.name as category'
                )
                ->get();

            return response()->json($items);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

public function store(Request $request)
{
    $user = $request->user();
    if ($user && $user->role === 'supervisor') {
        return response()->json(['message' => 'Supervisors have read-only access.'], 403);
    }

    $validator = Validator::make($request->all(), [
        'name'         => 'required|string|max:255',
        'sellingPrice' => 'required|numeric|min:0',
        'unitCost'     => 'nullable|numeric|min:0',
        'barcode'      => 'nullable|string|unique:menu_items,barcode',
        'category'     => 'nullable|string',
        'sub_category' => 'nullable|string',
        'type'         => 'required|string|in:FOOD,DRINK',
        'status'       => 'required|string|in:ACTIVE,INACTIVE',
    ]);

    if ($validator->fails()) {
        return response()->json(['message' => $validator->errors()->first()], 422);
    }

    try {
        DB::beginTransaction();

        // 1. Resolve Category Name to ID
        $categoryId = null;
        $cupId = null;
        if ($request->category) {
            $category = DB::table('categories')
                ->where('name', $request->category)
                ->first();

            if ($category) {
                $categoryId = $category->id;
                $cupId = $category->cup_id; // ← derive cup_id from category
            } else {
                $categoryId = DB::table('categories')->insertGetId([
                    'name'       => $request->category,
                    'type'       => strtolower($request->type),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Resolve Sub-Category Name to ID
        // Also derive cup_id from sub_category if available
        $subCategoryId = null;
        if ($request->sub_category && $categoryId) {
            $subCategory = DB::table('sub_categories')
                ->where('name', $request->sub_category)
                ->where('category_id', $categoryId)
                ->first();

            if ($subCategory) {
                $subCategoryId = $subCategory->id;
                // sub_category cup_id takes priority if set
                if (!empty($subCategory->cup_id)) {
                    $cupId = $subCategory->cup_id;
                }
            }
        }

        // 3. Insert Menu Item
        $itemId = DB::table('menu_items')->insertGetId([
            'name'            => $request->name,
            'barcode'         => $request->barcode,
            'category_id'     => $categoryId,
            'sub_category_id' => $subCategoryId,
            'price'           => $request->sellingPrice,
            'cost'            => $request->unitCost ?? 0,
            'type'            => strtolower($request->type),
            'status'          => strtolower($request->input('status')),
            'cup_id'          => $cupId, // ← derived, not user-supplied
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        DB::commit();
        $this->clearMenuCache();

        return response()->json([
            'message' => 'Item added successfully',
            'id'      => $itemId,
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'Database Error: ' . $e->getMessage()], 500);
    }
}
}