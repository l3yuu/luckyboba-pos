<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MenuListController extends Controller
{
    public function index()
    {
        $items = DB::table('menu_items')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select(
                'menu_items.id',
                'menu_items.name',
                'menu_items.barcode',
                'categories.name as category',
                'menu_items.price as sellingPrice',
                DB::raw('0.00 as unitCost'), 
                DB::raw('0.00 as totalCost')
            )
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'sellingPrice' => 'required|numeric|min:0',
            'barcode'      => 'nullable|string|unique:menu_items,barcode',
            'category'     => 'nullable|string',
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
            if ($request->category) {
                $category = DB::table('categories')
                    ->where('name', $request->category)
                    ->first();
                
                if ($category) {
                    $categoryId = $category->id;
                } else {
                    // Optional: Create the category if it doesn't exist
                    $categoryId = DB::table('categories')->insertGetId([
                        'name' => $request->category,
                        'type' => strtolower($request->type),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 2. Insert Menu Item
            $itemId = DB::table('menu_items')->insertGetId([
                'name'        => $request->name,
                'barcode'     => $request->barcode,
                'category_id' => $categoryId,
                'price'       => $request->sellingPrice,
                'type'        => strtolower($request->type),
                'status'      => strtolower($request->status),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Item added successfully',
                'id' => $itemId
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Database Error: ' . $e->getMessage()], 500);
        }
    }
}