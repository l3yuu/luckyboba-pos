<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SugarLevel;
use Illuminate\Http\Request;

use App\Traits\MenuCache;

class SugarLevelController extends Controller
{
    use MenuCache;

    // ── PUBLIC — POS fetches active levels only ───────────────────────────────
    public function index()
    {
        $levels = SugarLevel::active()->ordered()->get();

        return response()->json([
            'success' => true,
            'data'    => $levels,
        ]);
    }

    // ── ADMIN — all levels including inactive ─────────────────────────────────
    public function adminIndex()
    {
        $levels = SugarLevel::ordered()->get();

        return response()->json([
            'success' => true,
            'data'    => $levels,
        ]);
    }

    // ── ADMIN — create ────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'label'      => 'required|string|max:100',
            'value'      => 'required|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active'  => 'nullable|boolean',
        ]);

        $level = SugarLevel::create([
            'label'      => $request->label,
            'value'      => $request->value,
            'sort_order' => $request->sort_order ?? 99,
            'is_active'  => $request->boolean('is_active', true),
        ]);

        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'data'    => $level,
        ], 201);
    }

    // ── ADMIN — update ────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $level = SugarLevel::find($id);

        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Sugar level not found.',
            ], 404);
        }

        $request->validate([
            'label'      => 'sometimes|string|max:100',
            'value'      => 'sometimes|string|max:50',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active'  => 'sometimes|boolean',
        ]);

        $level->update($request->only(['label', 'value', 'sort_order', 'is_active']));

        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'data'    => $level->fresh(),
        ]);
    }

    // ── ADMIN — delete ────────────────────────────────────────────────────────
    public function destroy($id)
    {
        $level = SugarLevel::find($id);

        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Sugar level not found.',
            ], 404);
        }

        $level->delete();

        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'message' => 'Sugar level deleted.',
        ]);
    }

    // ── ADMIN — bulk reorder ──────────────────────────────────────────────────
    public function reorder(Request $request)
    {
        $request->validate([
            'order'   => 'required|array|min:1',
            'order.*' => 'integer|exists:sugar_levels,id',
        ]);

        foreach ($request->order as $position => $id) {
            SugarLevel::where('id', $id)->update([
                'sort_order' => $position + 1,
            ]);
        }

        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'data'    => SugarLevel::ordered()->get(),
        ]);
    }
    // In SugarLevelController.php
public function byMenuItem($menuItemId)
{
    $levels = SugarLevel::active()
        ->ordered()
        ->whereHas('menuItems', function ($q) use ($menuItemId) {
            $q->where('menu_items.id', $menuItemId);
        })
        ->get();

    return response()->json([
        'success' => true,
        'data'    => $levels, // empty array if none assigned — no fallback
    ]);
}
}