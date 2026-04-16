<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SugarLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    /**
     * GET /api/menu-item-sugar-levels?menu_item_id=X
     */
    public function byMenuItemViaQuery(Request $request)
    {
        $menuItemId = $request->query('menu_item_id');
        if (!$menuItemId) {
            return response()->json(['success' => false, 'message' => 'menu_item_id required'], 400);
        }
        
        $data = DB::table('menu_item_sugar_levels')
            ->where('menu_item_id', $menuItemId)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * PUT /api/menu-item-sugar-levels/{menu_item_id}
     */
    public function updateAssignment(Request $request, $menuItemId)
    {
        $request->validate([
            'sugar_level_ids'   => 'present|array',
            'sugar_level_ids.*' => 'integer|exists:sugar_levels,id',
        ]);

        DB::table('menu_item_sugar_levels')->where('menu_item_id', $menuItemId)->delete();

        $now  = now();
        $rows = collect($request->sugar_level_ids)->unique()->map(fn($sid) => [
            'menu_item_id'   => $menuItemId,
            'sugar_level_id' => $sid,
            'created_at'     => $now,
            'updated_at'     => $now,
        ])->all();

        if (!empty($rows)) {
            DB::table('menu_item_sugar_levels')->insert($rows);
        }

        $this->clearMenuCache();

        return response()->json(['success' => true, 'message' => 'Sugar levels updated.']);
    }
    
    public function byMenuItem($menuItemId)
    {
        return $this->byMenuItemViaQuery(new Request(['menu_item_id' => $menuItemId]));
    }
}