<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\AddOn;
use App\Models\Bundle;
use App\Traits\MenuCache;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SuperAdminAvailabilityController extends Controller
{
    use MenuCache;

    /**
     * GET /api/admin/branch-availability/branches
     */
    public function branches(): JsonResponse
    {
        $branches = Branch::orderBy('name')->get(['id', 'name']);
        return response()->json($branches);
    }

    /**
     * GET /api/admin/branch-availability/{branch_id}/items
     */
    public function items(int $branchId): JsonResponse
    {
        $overrides = DB::table('branch_availability')
            ->where('branch_id', $branchId)
            ->where('entity_type', 'menu_item')
            ->pluck('is_available', 'entity_id');

        $items = MenuItem::with('category')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => [
                'id'           => $item->id,
                'name'         => $item->name,
                'category'     => $item->category?->name ?? 'Uncategorized',
                'status'       => $item->status,
                'is_available' => $overrides->has($item->id) ? (bool) $overrides->get($item->id) : true,
            ]);

        return response()->json($items);
    }

    /**
     * GET /api/admin/branch-availability/{branch_id}/categories
     */
    public function categories(int $branchId): JsonResponse
    {
        $overrides = DB::table('branch_availability')
            ->where('branch_id', $branchId)
            ->where('entity_type', 'category')
            ->pluck('is_available', 'entity_id');

        $cats = Category::orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'           => $c->id,
                'name'         => $c->name,
                'is_active'    => (bool) $c->is_active,
                'is_available' => $overrides->has($c->id) ? (bool) $overrides->get($c->id) : true,
            ]);

        return response()->json($cats);
    }

    /**
     * GET /api/admin/branch-availability/{branch_id}/sub-categories
     */
    public function subCategories(int $branchId): JsonResponse
    {
        $overrides = DB::table('branch_availability')
            ->where('branch_id', $branchId)
            ->where('entity_type', 'sub_category')
            ->pluck('is_available', 'entity_id');

        $subs = SubCategory::with('category')
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id'           => $s->id,
                'name'         => $s->name,
                'category'     => $s->category?->name ?? 'N/A',
                'is_active'    => (bool) $s->is_active,
                'is_available' => $overrides->has($s->id) ? (bool) $overrides->get($s->id) : true,
            ]);

        return response()->json($subs);
    }

    /**
     * GET /api/admin/branch-availability/{branch_id}/add-ons
     */
    public function addOns(int $branchId): JsonResponse
    {
        $overrides = DB::table('branch_availability')
            ->where('branch_id', $branchId)
            ->where('entity_type', 'add_on')
            ->pluck('is_available', 'entity_id');

        $addOns = AddOn::orderBy('name')
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'name'         => $a->name,
                'is_active'    => (bool) $a->is_available, // Global 'is_available' is its active state
                'is_available' => $overrides->has($a->id) ? (bool) $overrides->get($a->id) : true,
            ]);

        return response()->json($addOns);
    }

    /**
     * GET /api/admin/branch-availability/{branch_id}/bundles
     */
    public function bundles(int $branchId): JsonResponse
    {
        $overrides = DB::table('branch_availability')
            ->where('branch_id', $branchId)
            ->where('entity_type', 'bundle')
            ->pluck('is_available', 'entity_id');

        $bundles = Bundle::orderBy('name')
            ->get()
            ->map(fn($b) => [
                'id'           => $b->id,
                'name'         => $b->name,
                'is_active'    => (bool) $b->is_active,
                'is_available' => $overrides->has($b->id) ? (bool) $overrides->get($b->id) : true,
            ]);

        return response()->json($bundles);
    }

    /**
     * POST /api/admin/branch-availability/toggle
     */
    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id'   => 'required|exists:branches,id',
            'entity_type' => 'required|in:menu_item,category,sub_category,add_on,bundle',
            'entity_id'   => 'required|integer',
        ]);

        $branchId   = $request->input('branch_id');
        $entityType = $request->input('entity_type');
        $entityId   = $request->input('entity_id');

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
                'branch_id'    => $branchId,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'is_available' => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
            $newValue = false;
        }

        $this->clearMenuCache();

        return response()->json([
            'success'      => true,
            'is_available' => $newValue,
        ]);
    }

    /**
     * POST /api/admin/branch-availability/toggle-global
     */
    public function toggleGlobal(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => 'required|in:menu_item,category,sub_category,add_on,bundle',
            'entity_id'   => 'required|integer',
        ]);

        $entityType = $request->input('entity_type');
        $entityId   = $request->input('entity_id');

        $model = match($entityType) {
            'menu_item'    => MenuItem::find($entityId),
            'category'     => Category::find($entityId),
            'sub_category' => SubCategory::find($entityId),
            'add_on'       => AddOn::find($entityId),
            'bundle'       => Bundle::find($entityId),
        };

        if (!$model) {
            return response()->json(['success' => false, 'message' => 'Entity not found.'], 404);
        }

        if ($entityType === 'menu_item') {
            $model->status = ($model->status === 'active') ? 'inactive' : 'active';
        } elseif ($entityType === 'add_on') {
            $model->is_available = !$model->is_available;
        } else {
            $model->is_active = !$model->is_active;
        }

        $model->save();
        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'model'   => $model,
        ]);
    }
}
