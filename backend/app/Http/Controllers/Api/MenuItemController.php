<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MenuItemController extends Controller
{
    private function selectFields(): array
    {
        return [
            'menu_items.id',
            'menu_items.name',
            'menu_items.category_id',
            'categories.name as category',
            'menu_items.sub_category_id as subcategory_id',
            'sub_categories.name as subcategory',
            'menu_items.price',
            'menu_items.barcode',
            DB::raw('NULL as image_path'),
            DB::raw("CASE WHEN menu_items.status = 'active' THEN 1 ELSE 0 END as is_available"),
        ];
    }

    private function baseQuery()
    {
        return DB::table('menu_items')
            ->leftJoin('categories',     'menu_items.category_id',     '=', 'categories.id')
            ->leftJoin('sub_categories', 'menu_items.sub_category_id', '=', 'sub_categories.id');
    }

    public function index()
    {
        $items = $this->baseQuery()
            ->select($this->selectFields())
            ->orderBy('menu_items.name')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name'           => 'required|string|max:255',
            'category_id'    => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:sub_categories,id',
            'price'          => 'required|numeric|min:0',
            'barcode'        => 'nullable|string|unique:menu_items,barcode',
            'is_available'   => 'boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['success' => false, 'errors' => $v->errors()], 422);
        }

        $id = DB::table('menu_items')->insertGetId([
            'name'            => $request->name,
            'category_id'     => $request->category_id,
            'sub_category_id' => $request->subcategory_id,
            'price'           => $request->price,
            'barcode'         => $request->barcode,
            'status'          => $request->boolean('is_available', true) ? 'active' : 'inactive',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $item = $this->baseQuery()
            ->where('menu_items.id', $id)
            ->select($this->selectFields())
            ->first();

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $v = Validator::make($request->all(), [
            'name'           => 'sometimes|string|max:255',
            'category_id'    => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:sub_categories,id',
            'price'          => 'sometimes|numeric|min:0',
            'barcode'        => 'nullable|string|unique:menu_items,barcode,' . $id,
            'is_available'   => 'boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['success' => false, 'errors' => $v->errors()], 422);
        }

        $payload = array_filter([
            'name'            => $request->name,
            'category_id'     => $request->category_id,
            'sub_category_id' => $request->subcategory_id,
            'price'           => $request->price,
            'barcode'         => $request->barcode,
            'status'          => $request->has('is_available')
                                    ? ($request->boolean('is_available') ? 'active' : 'inactive')
                                    : null,
            'updated_at'      => now(),
        ], fn($v) => !is_null($v));

        DB::table('menu_items')->where('id', $id)->update($payload);

        $item = $this->baseQuery()
            ->where('menu_items.id', $id)
            ->select($this->selectFields())
            ->first();

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function destroy($id)
    {
        DB::table('menu_items')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Item deleted.']);
    }
}