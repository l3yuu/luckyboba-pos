<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bundle;
use App\Models\Category;
use App\Traits\MenuCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BundleController extends Controller
{
    use MenuCache;
    /**
     * GET /api/bundles
     * Returns all bundles with their items — used by POS cache
     */
public function index(Request $request)
{
    $query = Bundle::with('items')->where('is_active', true);

    if ($request->has('category_id')) {
        $query->where('category_id', $request->category_id);
    }

    if ($request->has('name')) {
        $query->whereRaw('LOWER(name) = ?', [strtolower($request->name)]);
    }

    if ($request->has('barcode')) {
        $query->where('barcode', $request->barcode);  // ✅ add this
    }

    $bundles = $query->orderBy('category')->get();

    return response()->json($bundles);
}

    /**
     * GET /api/bundles/all
     * Returns ALL bundles (including inactive) — used by superadmin UI
     */
    public function all()
    {
        $bundles = Bundle::with('items')
            ->orderBy('category')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $bundles,
        ]);
    }

    /**
     * GET /api/bundles/{id}
     */
    public function show($id)
    {
        $bundle = Bundle::with('items')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $bundle,
        ]);
    }

    /**
     * POST /api/bundles
     * Superadmin creates a new bundle or combo
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'display_name'  => 'nullable|string|max:255',
            'category_id'   => 'required|exists:categories,id',
            'bundle_type'   => 'required|in:bundle,combo,mix_and_match',
            'price'         => 'required|numeric|min:0',
            'barcode'       => 'required|string|unique:bundles,barcode',
            'size'          => 'nullable|string',
            'cup_id'        => 'nullable|exists:cups,id',
            'is_active'     => 'nullable|boolean',
            'items'         => 'required|array|min:1',
            'items.*.custom_name'  => 'required|string|max:255',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.size'         => 'nullable|string',
            'items.*.display_name' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Resolve category name for backward compat with POS cache
            $category = Category::findOrFail($validated['category_id']);

            $bundle = Bundle::create([
                'name'         => $validated['name'],
                'display_name' => $validated['display_name'] ?? null,
                'category'     => $category->name,        // keep string for POS
                'category_id'  => $validated['category_id'],
                'bundle_type'  => $validated['bundle_type'],
                'price'        => $validated['price'],
                'barcode'      => $validated['barcode'],
                'size'         => $validated['size'] ?? 'L',
                'cup_id'       => $validated['cup_id'] ?? null,
                'is_active'    => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['items'] as $item) {
                $bundle->items()->create([
                    'custom_name'  => $item['custom_name'],
                    'quantity'     => $item['quantity'],
                    'size'         => $item['size'] ?? 'none',
                    'display_name' => $item['display_name'] ?? null,
                ]);
            }

            // Auto-update category_type if needed
            if (!in_array($category->category_type, ['bundle', 'combo'])) {
                $category->update(['category_type' => $validated['bundle_type']]);
            }

            DB::commit();
            $this->clearMenuCache();

            return response()->json([
                'success' => true,
                'data'    => $bundle->load('items'),
                'message' => 'Bundle created successfully',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bundle store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create bundle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/bundles/{id}
     * Superadmin edits a bundle
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'          => 'sometimes|required|string|max:255',
            'display_name'  => 'sometimes|nullable|string|max:255',
            'category_id'   => 'sometimes|exists:categories,id',
            'bundle_type'   => 'sometimes|in:bundle,combo,mix_and_match',
            'price'         => 'sometimes|numeric|min:0',
            'barcode'       => 'sometimes|string|unique:bundles,barcode,' . $id,
            'size'          => 'sometimes|nullable|string',
            'cup_id'        => 'sometimes|nullable|exists:cups,id',
            'is_active'     => 'sometimes|boolean',
            'items'         => 'sometimes|array|min:1',
            'items.*.custom_name'  => 'required_with:items|string|max:255',
            'items.*.quantity'     => 'required_with:items|integer|min:1',
            'items.*.size'         => 'nullable|string',
            'items.*.display_name' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $bundle = Bundle::findOrFail($id);

            // If category changed, update the string field too
            if (isset($validated['category_id'])) {
                $category = Category::findOrFail($validated['category_id']);
                $validated['category'] = $category->name;
            }

            $bundle->update($validated);

            // Replace all items if new items were sent
            if (isset($validated['items'])) {
                $bundle->items()->delete();
                foreach ($validated['items'] as $item) {
                    $bundle->items()->create([
                        'custom_name'  => $item['custom_name'],
                        'quantity'     => $item['quantity'],
                        'size'         => $item['size'] ?? 'none',
                        'display_name' => $item['display_name'] ?? null,
                    ]);
                }
            }

            DB::commit();
            $this->clearMenuCache();

            return response()->json([
                'success' => true,
                'data'    => $bundle->fresh()->load('items'),
                'message' => 'Bundle updated successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bundle update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update bundle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/bundles/{id}
     */
    public function destroy($id)
    {
        try {
            $bundle = Bundle::findOrFail($id);
            $bundle->items()->delete();
            $bundle->delete();

            $this->clearMenuCache();

            return response()->json([
                'success' => true,
                'message' => 'Bundle deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete bundle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/bundles/{id}/toggle
     * Quick active/inactive toggle for superadmin table
     */
    public function toggle($id)
    {
        $bundle = Bundle::findOrFail($id);
        $bundle->update(['is_active' => !$bundle->is_active]);

        $this->clearMenuCache();

        return response()->json([
            'success'   => true,
            'is_active' => $bundle->is_active,
            'message'   => $bundle->is_active ? 'Bundle activated' : 'Bundle deactivated',
        ]);
    }
}