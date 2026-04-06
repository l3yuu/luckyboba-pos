<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Exports\MenuItemTemplateExport;
use App\Exports\MenuItemExport;
use App\Imports\MenuItemImport;
use Maatwebsite\Excel\Facades\Excel;

class MenuItemController extends Controller
{
    private function selectFields(): array
    {
        return [
            'menu_items.id',
            'menu_items.name',
            'menu_items.category_id',
            'categories.name as category',
            'categories.category_type',
            'menu_items.sub_category_id as subcategory_id',
            'sub_categories.name as subcategory',
            'menu_items.price',
            'menu_items.grab_price',    // ✅ add
            'menu_items.panda_price',   // ✅ add
            'menu_items.barcode',
            'menu_items.size',
            DB::raw("CASE WHEN menu_items.image IS NOT NULL THEN CONCAT('".url('storage')."/', menu_items.image) ELSE NULL END as image_path"),
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
            'grab_price'     => 'nullable|numeric|min:0',   // ✅ add
            'panda_price'    => 'nullable|numeric|min:0',   // ✅ add
            'barcode'        => 'nullable|string|unique:menu_items,barcode',
            'is_available'   => 'boolean',
            'image'          => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);
        
        if ($v->fails()) {
            return response()->json(['success' => false, 'errors' => $v->errors()], 422);
        }

        // ✅ Handle Image Upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            // Saves to storage/app/public/menu_images
            $imagePath = $request->file('image')->store('menu_images', 'public');
        }

        $id = DB::table('menu_items')->insertGetId([
            'name'            => $request->name,
            'category_id'     => $request->category_id,
            'sub_category_id' => $request->subcategory_id,
            'price'           => $request->price,
            'barcode'         => $request->barcode,
            'image'           => $imagePath, // ✅ Save path to database
            'status'          => $request->boolean('is_available', true) ? 'active' : 'inactive',
            'created_at'      => now(),
            'updated_at'      => now(),
            'grab_price'  => $request->grab_price  ?? 0,   // ✅ add
            'panda_price' => $request->panda_price ?? 0,   // ✅ add
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
            'grab_price'     => 'nullable|numeric|min:0',   // ✅ add
            'panda_price'    => 'nullable|numeric|min:0',   // ✅ add
            'barcode'        => 'nullable|string|unique:menu_items,barcode,' . $id,
            'is_available'   => 'boolean',
            'image'          => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);
        
        if ($v->fails()) {
            return response()->json(['success' => false, 'errors' => $v->errors()], 422);
        }

        // Find the existing item so we can delete the old image if a new one is uploaded
        $existingItem = DB::table('menu_items')->where('id', $id)->first();

        // Build Payload
        $payload = ['updated_at' => now()];

        if ($request->has('name'))           $payload['name']            = $request->name;
        if ($request->has('category_id'))    $payload['category_id']     = $request->category_id;
        if ($request->has('subcategory_id')) $payload['sub_category_id'] = $request->subcategory_id;
        if ($request->has('price'))          $payload['price']           = $request->price;
        if ($request->has('barcode'))        $payload['barcode']         = $request->barcode;
        if ($request->has('grab_price'))     $payload['grab_price']      = (float) $request->grab_price;
        if ($request->has('panda_price'))    $payload['panda_price']     = (float) $request->panda_price;
        if ($request->has('is_available'))   $payload['status']          = $request->boolean('is_available') ? 'active' : 'inactive';

        // ✅ Handle Image Update
        if ($request->hasFile('image')) {
            // Delete old image from storage if it exists
            if ($existingItem && $existingItem->image) {
                Storage::disk('public')->delete($existingItem->image);
            }
            // Save new image
            $payload['image'] = $request->file('image')->store('menu_images', 'public');
        }

        DB::table('menu_items')->where('id', $id)->update($payload);

        $item = $this->baseQuery()
            ->where('menu_items.id', $id)
            ->select($this->selectFields())
            ->first();

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function destroy($id)
    {
        // ✅ Delete image from server when item is deleted
        $existingItem = DB::table('menu_items')->where('id', $id)->first();
        if ($existingItem && $existingItem->image) {
            Storage::disk('public')->delete($existingItem->image);
        }

        DB::table('menu_items')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Item deleted.']);
    }

    public function downloadTemplate()
    {
        return Excel::download(new MenuItemTemplateExport, 'menu_items_template.xlsx');
    }

    public function export()
    {
        return Excel::download(new MenuItemExport, 'current_menu_items.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            Excel::import(new MenuItemImport, $request->file('file'));
            return response()->json(['success' => true, 'message' => 'Items imported/updated successfully.']);
        } catch (\Exception $e) {
            \Log::error('Import Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }
}