<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\AddOn;
use App\Models\Bundle;
use App\Traits\MenuCache;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BranchManagerAppController extends Controller
{
    use MenuCache;

    // ── GET /api/branch/app-orders ────────────────────────────────────────────
    public function appOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Sale::with(['items'])
            ->where('invoice_number', 'like', 'APP-%')
            ->whereDate('created_at', today());

        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        }

        $orders = $query
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(Sale $sale) => $this->formatOrder($sale));

        return response()->json($orders);
    }

    // ── PATCH /api/branch/app-orders/{id}/status ──────────────────────────────
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,preparing,completed'],
        ]);

        $user = $request->user();

        $query = Sale::where('id', $id)
            ->where('invoice_number', 'like', 'APP-%');

        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        }

        $sale = $query->firstOrFail();
        $sale->update(['status' => $request->status]);

        return response()->json($this->formatOrder($sale->load('items')));
    }

    // ── GET /api/branch/menu-items ────────────────────────────────────────────
    public function menuItems(Request $request): JsonResponse
    {
        $user     = $request->user();
        $branchId = $user->branch_id;

        $overrides = $this->getOverrides($branchId, 'menu_item');

        $items = MenuItem::with('category')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => [
                'id'           => $item->id,
                'name'         => $item->name,
                'category'     => $item->category?->name ?? 'Uncategorized',
                'sellingPrice' => (float) ($item->price ?? $item->selling_price ?? 0),
                'quantity'     => (int)   ($item->quantity ?? 0),
                'is_available' => $overrides->has($item->id)
                    ? (bool) $overrides->get($item->id)
                    : true,
                'image'        => $item->image
                    ? (str_starts_with($item->image, 'http')
                        ? $item->image
                        : url('storage/' . $item->image))
                    : null,
            ]);

        return response()->json($items);
    }

    // ── GET /api/branch/categories ────────────────────────────────────────────
    public function categoryList(Request $request): JsonResponse
    {
        $branchId  = $request->user()->branch_id;
        $overrides = $this->getOverrides($branchId, 'category');

        $cats = Category::withCount('menuItems')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'               => $c->id,
                'name'             => $c->name,
                'type'             => $c->type,
                'category_type'    => $c->category_type,
                'menu_items_count' => $c->menu_items_count,
                'is_available'     => $overrides->has($c->id)
                    ? (bool) $overrides->get($c->id)
                    : true,
            ]);

        return response()->json($cats);
    }

    // ── GET /api/branch/sub-categories ────────────────────────────────────────
    public function subCategoryList(Request $request): JsonResponse
    {
        $branchId  = $request->user()->branch_id;
        $overrides = $this->getOverrides($branchId, 'sub_category');

        $subs = SubCategory::with('category')
            ->withCount('menuItems')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id'               => $s->id,
                'name'             => $s->name,
                'category'         => $s->category?->name ?? 'N/A',
                'menu_items_count' => $s->menu_items_count,
                'is_available'     => $overrides->has($s->id)
                    ? (bool) $overrides->get($s->id)
                    : true,
            ]);

        return response()->json($subs);
    }

    // ── GET /api/branch/add-ons ───────────────────────────────────────────────
    public function addOnList(Request $request): JsonResponse
    {
        $branchId  = $request->user()->branch_id;
        $overrides = $this->getOverrides($branchId, 'add_on');

        $addOns = AddOn::where('is_available', true)
            ->orderBy('name')
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'name'         => $a->name,
                'price'        => (float) $a->price,
                'category'     => $a->category ?? 'General',
                'is_available' => $overrides->has($a->id)
                    ? (bool) $overrides->get($a->id)
                    : true,
            ]);

        return response()->json($addOns);
    }

    // ── GET /api/branch/bundles ───────────────────────────────────────────────
    public function bundleList(Request $request): JsonResponse
    {
        $branchId  = $request->user()->branch_id;
        $overrides = $this->getOverrides($branchId, 'bundle');

        $bundles = Bundle::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($b) => [
                'id'           => $b->id,
                'name'         => $b->name,
                'price'        => (float) $b->price,
                'category'     => $b->category ?? 'General',
                'bundle_type'  => $b->bundle_type,
                'is_available' => $overrides->has($b->id)
                    ? (bool) $overrides->get($b->id)
                    : true,
            ]);

        return response()->json($bundles);
    }

    // ── POST /api/branch/menu-items/{id}/toggle ───────────────────────────────
    // Kept for backward compatibility
    public function toggleMenuItem(Request $request, int $id): JsonResponse
    {
        $user     = $request->user();
        $branchId = $user->branch_id;

        $item = MenuItem::findOrFail($id);

        $newValue = $this->toggleAvailability($branchId, 'menu_item', $id);

        return response()->json([
            'id'           => $item->id,
            'name'         => $item->name,
            'is_available' => $newValue,
        ]);
    }

    // ── POST /api/branch/availability/toggle ──────────────────────────────────
    public function toggleEntity(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => 'required|in:menu_item,category,sub_category,add_on,bundle',
            'entity_id'   => 'required|integer',
        ]);

        $branchId   = $request->user()->branch_id;
        $entityType = $request->entity_type;
        $entityId   = $request->entity_id;

        // Verify entity exists and check global status
        $entity = $this->getEntity($entityType, $entityId);
        
        $isGloballyActive = match ($entityType) {
            'menu_item'    => $entity->status === 'active',
            'category'     => (bool) $entity->is_active,
            'sub_category' => (bool) $entity->is_active,
            'add_on'       => (bool) $entity->is_available,
            'bundle'       => (bool) $entity->is_active,
            default        => true,
        };

        if (!$isGloballyActive) {
            return response()->json([
                'message' => 'Admin deactivated this item',
                'error'   => 'Global deactivation is in effect.'
            ], 403);
        }

        $newValue = $this->toggleAvailability($branchId, $entityType, $entityId);

        $this->clearMenuCache();

        return response()->json([
            'entity_type'  => $entityType,
            'entity_id'    => $entityId,
            'is_available' => $newValue,
        ]);
    }

    private function getEntity(string $type, int $id)
    {
        $model = match ($type) {
            'menu_item'    => MenuItem::class,
            'category'     => Category::class,
            'sub_category' => SubCategory::class,
            'add_on'       => AddOn::class,
            'bundle'       => Bundle::class,
        };

        return $model::findOrFail($id);
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private function getOverrides(int $branchId, string $entityType)
    {
        try {
            return DB::table('branch_availability')
                ->where('branch_id', $branchId)
                ->where('entity_type', $entityType)
                ->pluck('is_available', 'entity_id');
        } catch (\Exception $e) {
            // Fallback to old table for menu items if new table doesn't exist yet
            if ($entityType === 'menu_item') {
                return DB::table('branch_menu_availability')
                    ->where('branch_id', $branchId)
                    ->pluck('is_available', 'menu_item_id');
            }
            return collect();
        }
    }

    private function toggleAvailability(int $branchId, string $entityType, int $entityId): bool
    {
        $existing = DB::table('branch_availability')
            ->where('branch_id', $branchId)
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->first();

        if ($existing) {
            $newValue = !$existing->is_available;
            DB::table('branch_availability')
                ->where('branch_id', $branchId)
                ->where('entity_type', $entityType)
                ->where('entity_id', $entityId)
                ->update([
                    'is_available' => $newValue,
                    'updated_at'   => now(),
                ]);
        } else {
            DB::table('branch_availability')->insert([
                'branch_id'   => $branchId,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'is_available' => false,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            $newValue = false;
        }

        // Also sync to the old table for menu items (backward compat)
        if ($entityType === 'menu_item') {
            $oldExists = DB::table('branch_menu_availability')
                ->where('branch_id', $branchId)
                ->where('menu_item_id', $entityId)
                ->exists();

            if ($oldExists) {
                DB::table('branch_menu_availability')
                    ->where('branch_id', $branchId)
                    ->where('menu_item_id', $entityId)
                    ->update(['is_available' => $newValue, 'updated_at' => now()]);
            } else {
                DB::table('branch_menu_availability')->insert([
                    'branch_id'    => $branchId,
                    'menu_item_id' => $entityId,
                    'is_available' => $newValue,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }
        }

        return $newValue;
    }


    private function formatOrder(Sale $sale): array
    {
        return [
            'id'             => $sale->id,
            'invoice_number' => $sale->invoice_number,
            'customer_name'  => $sale->customer_name ?? 'App Customer',
            'total_amount'   => (float) $sale->total_amount,
            'status'         => $sale->status ?? 'pending',
            'created_at'     => $sale->created_at,
            'items'          => $sale->items->map(function ($item) {
                $rawAddons = $item->add_ons;
                if (is_string($rawAddons)) {
                    $decoded   = json_decode($rawAddons, true);
                    $rawAddons = json_last_error() === JSON_ERROR_NONE ? $decoded : [$rawAddons];
                }
                return [
                    'id'       => $item->id,
                    'name'     => $item->product_name,
                    'qty'      => (int)   $item->quantity,
                    'price'    => (float) $item->final_price,
                    'cup_size' => $item->size ?? null,
                    'add_ons'  => is_array($rawAddons) ? $rawAddons : [],
                ];
            })->values()->toArray(),
        ];
    }
}