<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * GET /api/recipes
     * List all recipes with their ingredients and menu item.
     */
    public function index(Request $request)
    {
        $query = Recipe::with('items.rawMaterial', 'menuItem');

        // Filter by menu_item_id
        if ($request->filled('menu_item_id')) {
            $query->where('menu_item_id', $request->menu_item_id);
        }

        // Filter active only
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/recipes/by-menu-item/{menuItemId}
     * Get all recipes (M + L) for a specific menu item.
     */
    public function byMenuItem($menuItemId)
    {
        $recipes = Recipe::with('items.rawMaterial')
            ->where('menu_item_id', $menuItemId)
            ->get();

        return response()->json($recipes);
    }

    /**
     * GET /api/recipes/{recipe}
     * Show a single recipe with ingredients.
     */
    public function show(Recipe $recipe)
    {
        return response()->json($recipe->load('items.rawMaterial', 'menuItem'));
    }

    /**
     * POST /api/recipes
     * Create a new recipe with ingredients.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'menu_item_id'            => 'required|exists:menu_items,id',
            'size'                    => 'nullable|string|in:M,L',
            'is_active'               => 'boolean',
            'notes'                   => 'nullable|string',
            'items'                   => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity'        => 'required|numeric|min:0.0001',
            'items.*.unit'            => 'required|string',
            'items.*.notes'           => 'nullable|string',
        ]);

        // Prevent duplicate recipe for same menu_item + size
        $exists = Recipe::where('menu_item_id', $validated['menu_item_id'])
            ->where('size', $validated['size'] ?? null)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A recipe for this item and size already exists. Use the update endpoint instead.',
            ], 422);
        }

        $recipe = Recipe::create([
            'menu_item_id' => $validated['menu_item_id'],
            'size'         => $validated['size'] ?? null,
            'is_active'    => $validated['is_active'] ?? true,
            'notes'        => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $recipe->items()->create($item);
        }

        return response()->json($recipe->load('items.rawMaterial', 'menuItem'), 201);
    }

    /**
     * PATCH /api/recipes/{recipe}
     * Update a recipe's details and replace all its ingredients.
     */
    public function update(Request $request, Recipe $recipe)
    {
        $validated = $request->validate([
            'is_active'               => 'boolean',
            'notes'                   => 'nullable|string',
            'items'                   => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity'        => 'required|numeric|min:0.0001',
            'items.*.unit'            => 'required|string',
            'items.*.notes'           => 'nullable|string',
        ]);

        $recipe->update([
            'is_active' => $validated['is_active'] ?? $recipe->is_active,
            'notes'     => $validated['notes'] ?? null,
        ]);

        // Replace all ingredient items
        $recipe->items()->delete();
        foreach ($validated['items'] as $item) {
            $recipe->items()->create($item);
        }

        return response()->json($recipe->load('items.rawMaterial', 'menuItem'));
    }

    /**
     * DELETE /api/recipes/{recipe}
     * Delete a recipe and all its ingredients.
     */
    public function destroy(Recipe $recipe)
    {
        $recipe->items()->delete();
        $recipe->delete();

        return response()->json(['message' => 'Recipe deleted successfully.']);
    }

    /**
     * PATCH /api/recipes/{recipe}/toggle
     * Quickly enable or disable a recipe without touching ingredients.
     */
    public function toggle(Recipe $recipe)
    {
        $recipe->update(['is_active' => !$recipe->is_active]);

        return response()->json([
            'message'   => 'Recipe ' . ($recipe->is_active ? 'activated' : 'deactivated') . '.',
            'is_active' => $recipe->is_active,
        ]);
    }
}