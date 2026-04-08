<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    public function index()
    {
        try {
            return Cache::remember('menu_data_v5', 600, function () {
                return Category::where('is_active', true)
                    ->with([
                        'cup',
                        'subCategories' => fn($q) => $q->where('is_active', true),
                        'menu_items' => fn($q) => $q->where('status', 'active'),
                        'menu_items.options',
                        'menu_items.sugarLevels'
                    ])
                    ->orderBy('name', 'asc')
                    ->get()
                    ->map(function ($cat) {
                        $subCategories = $cat->subCategories->sortBy('name')->values();

                        return [
                            'id'             => $cat->id,
                            'name'           => $cat->name,
                            'type'           => $cat->type,
                            'category_type'  => $cat->category_type,
                            'cup'            => $cat->cup,
                            'sub_categories' => $subCategories->map(fn($s) => [
                                'id'   => $s->id,
                                'name' => $s->name,
                            ]),
                            'menu_items' => $cat->menu_items->map(fn($item) => [
                                'id'              => $item->id,
                                'name'            => $item->name,
                                'price'           => $item->price,
                                'grab_price'      => $item->grab_price,
                                'panda_price'     => $item->panda_price,
                                'barcode'         => $item->barcode,
                                'size'            => $item->size,
                                'sub_category_id' => $item->sub_category_id,
                                'options'         => $item->options->pluck('option_type'),
                                'sugar_levels'    => $item->sugarLevels
                                    ->where('is_active', true)
                                    ->sortBy('sort_order')
                                    ->values()
                                    ->map(fn($s) => [
                                        'id'    => $s->id,
                                        'label' => $s->label,
                                        'value' => $s->value,
                                    ]),
                            ]),
                        ];
                    });
            });
        } catch (\Exception $e) {
            \Log::error('Menu fetch error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Failed to fetch menu',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function clearCache()
    {
        Cache::forget('menu_data_v1');
        Cache::forget('menu_data_v2');
        Cache::forget('menu_data_v3');
        Cache::forget('menu_data_v4');
        Cache::forget('menu_data_v5');
        Cache::put('menu_version', time());
        return response()->json(['message' => 'Menu cache cleared successfully']);
    }

    public function version()
    {
        return response()->json([
            'version' => Cache::get('menu_version', 0)
        ]);
    }
}