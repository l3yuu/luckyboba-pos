<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Traits\MenuCache;

class MenuItemAddonController extends Controller
{
    use MenuCache;

    /**
     * GET /api/menu-item-addons?menu_item_id=X
     * Returns addons for a specific menu item
     */
    public function index(Request $request)
    {
        $query = DB::table('menu_item_addons');

        if ($request->has('menu_item_id')) {
            $query->where('menu_item_id', $request->menu_item_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * PUT /api/menu-item-addons/{menu_item_id}
     * Replace all addons for a menu item
     */
    public function update(Request $request, $menuItemId)
    {
        $request->validate([
            'addon_ids'   => 'present|array',
            'addon_ids.*' => 'integer|exists:add_ons,id',
        ]);

        DB::table('menu_item_addons')->where('menu_item_id', $menuItemId)->delete();

        $now  = now();
        $rows = collect($request->addon_ids)->unique()->map(fn($addonId) => [
            'menu_item_id' => $menuItemId,
            'addon_id'     => $addonId,
            'created_at'   => $now,
            'updated_at'   => $now,
        ])->values()->all();

        if (!empty($rows)) {
            DB::table('menu_item_addons')->insert($rows);
        }

        $this->clearMenuCache();

        return response()->json([
            'success' => true,
            'data'    => DB::table('menu_item_addons')->where('menu_item_id', $menuItemId)->get(),
            'message' => 'Add-ons updated.',
        ]);
    }
}
