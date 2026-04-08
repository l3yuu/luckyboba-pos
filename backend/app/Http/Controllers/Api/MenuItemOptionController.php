<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Traits\MenuCache;

class MenuItemOptionController extends Controller
{
    use MenuCache;

    /**
     * GET /api/menu-item-options?menu_item_id=X
     * Returns options for a specific menu item
     */
    public function index(Request $request)
    {
        $query = DB::table('menu_item_options');

        if ($request->has('menu_item_id')) {
            $query->where('menu_item_id', $request->menu_item_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * GET /api/menu-item-options/bulk?ids[]=1&ids[]=2
     * Returns options for multiple menu items at once
     */
    public function bulk(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $options = DB::table('menu_item_options')
            ->whereIn('menu_item_id', $ids)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $options,
        ]);
    }

    /**
     * PUT /api/menu-item-options/{menu_item_id}
     * Replace all options for a menu item
     */
    public function update(Request $request, $menuItemId)
    {
        $request->validate([
            'options'   => 'required|array',
            'options.*' => 'in:pearl,ice',
        ]);

        DB::table('menu_item_options')->where('menu_item_id', $menuItemId)->delete();

        $now  = now();
        $rows = collect($request->options)->unique()->map(fn($type) => [
            'menu_item_id' => $menuItemId,
            'option_type'  => $type,
            'created_at'   => $now,
            'updated_at'   => $now,
        ])->values()->all();

        if (!empty($rows)) {
            DB::table('menu_item_options')->insert($rows);
        }

        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'data'    => DB::table('menu_item_options')->where('menu_item_id', $menuItemId)->get(),
            'message' => 'Options updated.',
        ]);
    }
}