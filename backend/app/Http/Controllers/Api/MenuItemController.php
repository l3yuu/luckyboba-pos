<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Exports\MenuItemTemplateExport;
use App\Exports\MenuItemExport;
use App\Imports\MenuItemImport;
use App\Traits\MenuCache;
use Maatwebsite\Excel\Facades\Excel;

class MenuItemController extends Controller
{
    use MenuCache;

    private function denyIfSupervisor()
    {
        $user = auth()->user();
        if ($user && $user->role === 'supervisor') {
            return response()->json(['message' => 'Supervisors have read-only access.'], 403);
        }
        return null;
    }

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
            'menu_items.grab_price',
            'menu_items.panda_price',
            'menu_items.barcode',
            DB::raw("CASE 
                WHEN menu_items.size = 'L' THEN COALESCE(cups.size_l, 'L')
                WHEN menu_items.size = 'M' THEN COALESCE(cups.size_m, 'M')
                WHEN menu_items.size = 'none' THEN COALESCE(cups.size_m, 'Standard')
                ELSE COALESCE(menu_items.size, 'Standard')
            END as size"),
            DB::raw("CASE WHEN menu_items.image IS NOT NULL THEN CONCAT('" . url('storage') . "/', menu_items.image) ELSE NULL END as image_path"),
            DB::raw("CASE WHEN menu_items.status = 'active' THEN 1 ELSE 0 END as is_available"),
        ];
    }

    private function baseQuery()
    {
        return DB::table('menu_items')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('sub_categories', 'menu_items.sub_category_id', '=', 'sub_categories.id')
            ->leftJoin('cups', 'categories.cup_id', '=', 'cups.id');
    }

    public function index()
    {
        $items = $this->baseQuery()
            ->select($this->selectFields())
            ->orderBy('menu_items.name')
            ->get();

        Log::info('MenuItemController::index', ['count' => $items->count()]);
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        if ($deny = $this->denyIfSupervisor())
            return $deny;

        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:sub_categories,id',
            'price' => 'required|numeric|min:0',
            'grab_price' => 'nullable|numeric|min:0',
            'panda_price' => 'nullable|numeric|min:0',
            // FIX: barcode is truly nullable — only enforce unique when provided
            'barcode' => 'nullable|string|max:255|unique:menu_items,barcode',
            'is_available' => 'nullable|in:0,1,true,false',
            // FIX: max:4096 (4MB) to give headroom; browser already limits to 2MB via JS
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        if ($v->fails()) {
            Log::warning('MenuItemController::store validation failed', ['errors' => $v->errors()->toArray()]);
            return response()->json(['success' => false, 'errors' => $v->errors()], 422);
        }

        // Handle Image Upload
        $imagePath = null;
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $imagePath = $request->file('image')->store('menu_images', 'public');
        }

        // Resolve is_available: FormData sends strings "1"/"0"
        $isAvailable = filter_var($request->input('is_available', true), FILTER_VALIDATE_BOOLEAN);

        $id = DB::table('menu_items')->insertGetId([
            'name' => $request->name,
            'category_id' => $request->category_id ?: null,
            'sub_category_id' => $request->subcategory_id ?: null,
            'price' => (float) $request->price,
            'grab_price' => (float) ($request->grab_price ?? 0),
            'panda_price' => (float) ($request->panda_price ?? 0),
            'barcode' => $request->barcode ?: null,
            'image' => $imagePath,
            'status' => $isAvailable ? 'active' : 'inactive',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $item = $this->baseQuery()
            ->where('menu_items.id', $id)
            ->select($this->selectFields())
            ->first();

        $this->clearMenuCache();
        Log::info('MenuItemController::store', ['id' => $id]);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        if ($deny = $this->denyIfSupervisor())
            return $deny;

        // FIX: Ensure $id is cast to int to prevent type mismatch in unique rule
        $id = (int) $id;

        // Verify the item exists first
        $existingItem = DB::table('menu_items')->where('id', $id)->first();
        if (!$existingItem) {
            return response()->json(['success' => false, 'message' => 'Menu item not found.'], 404);
        }

        $v = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:sub_categories,id',
            'price' => 'sometimes|numeric|min:0',
            'grab_price' => 'nullable|numeric|min:0',
            'panda_price' => 'nullable|numeric|min:0',
            // FIX: Properly ignore the current item's own barcode in the unique check
            'barcode' => 'nullable|string|max:255|unique:menu_items,barcode,' . $id . ',id',
            'is_available' => 'nullable|in:0,1,true,false',
            // FIX: max:4096 to match server limits; JS enforces 2MB on client side
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        if ($v->fails()) {
            Log::warning('MenuItemController::update validation failed', [
                'id' => $id,
                'errors' => $v->errors()->toArray(),
                'input' => $request->except('image'), // Don't log file data
            ]);
            return response()->json(['success' => false, 'errors' => $v->errors()], 422);
        }

        // Build payload — only include fields that were actually sent
        $payload = ['updated_at' => now()];

        if ($request->has('name'))
            $payload['name'] = $request->name;
        if ($request->has('category_id'))
            $payload['category_id'] = $request->category_id ?: null;
        if ($request->has('subcategory_id'))
            $payload['sub_category_id'] = $request->subcategory_id ?: null;
        if ($request->has('price'))
            $payload['price'] = (float) $request->price;
        if ($request->has('grab_price'))
            $payload['grab_price'] = (float) $request->grab_price;
        if ($request->has('panda_price'))
            $payload['panda_price'] = (float) $request->panda_price;
        if ($request->has('barcode'))
            $payload['barcode'] = $request->barcode ?: null;

        // FIX: is_available comes as string "1"/"0" from FormData — handle both
        if ($request->has('is_available')) {
            $payload['status'] = filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN)
                ? 'active'
                : 'inactive';
        }

        // Handle Image Upload — delete old image first
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            if ($existingItem->image) {
                Storage::disk('public')->delete($existingItem->image);
            }
            $payload['image'] = $request->file('image')->store('menu_images', 'public');
        }

        DB::table('menu_items')->where('id', $id)->update($payload);

        $item = $this->baseQuery()
            ->where('menu_items.id', $id)
            ->select($this->selectFields())
            ->first();

        $this->clearMenuCache();
        Log::info('MenuItemController::update', ['id' => $id, 'fields_updated' => array_keys($payload)]);

        return response()->json(['success' => true, 'data' => $item]);
    }

    public function destroy($id)
    {
        if ($deny = $this->denyIfSupervisor())
            return $deny;

        $existingItem = DB::table('menu_items')->where('id', $id)->first();
        if ($existingItem && $existingItem->image) {
            Storage::disk('public')->delete($existingItem->image);
        }

        DB::table('menu_items')->where('id', $id)->delete();
        $this->clearMenuCache();
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
        if ($deny = $this->denyIfSupervisor())
            return $deny;

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:4096',
        ]);

        try {
            Excel::import(new MenuItemImport(), $request->file('file'));
            $this->clearMenuCache();
            return response()->json(['success' => true, 'message' => 'Items imported/updated successfully.']);
        } catch (\Exception $e) {
            Log::error('MenuItemController::import failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }
}