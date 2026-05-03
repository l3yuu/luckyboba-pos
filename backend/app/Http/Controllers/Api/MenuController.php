<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function index()
    {
        try {
            $user     = auth()->user();
            $branchId = $user?->branch_id;

            // Use a branch-specific cache key so each branch sees its own filtered menu
            $cacheKey = $branchId ? "menu_data_v6_branch_{$branchId}" : 'menu_data_v6';

            return Cache::remember($cacheKey, 600, function () use ($branchId) {

                // Load branch overrides for all entity types
                $catOverrides  = collect();
                $subOverrides  = collect();
                $itemOverrides = collect();

                if ($branchId) {
                    $allOverrides = DB::table('branch_availability')
                        ->where('branch_id', $branchId)
                        ->where('is_available', false)
                        ->get();

                    $catOverrides  = $allOverrides->where('entity_type', 'category')->pluck('entity_id');
                    $subOverrides  = $allOverrides->where('entity_type', 'sub_category')->pluck('entity_id');
                    $itemOverrides = $allOverrides->where('entity_type', 'menu_item')->pluck('entity_id');
                }

                return Category::where('is_active', true)
                    ->when($catOverrides->isNotEmpty(), fn($q) => $q->whereNotIn('id', $catOverrides))
                    ->with([
                        'cup',
                        'subCategories' => function ($q) use ($subOverrides) {
                            $q->where('is_active', true);
                            if ($subOverrides->isNotEmpty()) {
                                $q->whereNotIn('sub_categories.id', $subOverrides);
                            }
                        },
                        'menu_items' => function ($q) use ($itemOverrides) {
                            $q->where('status', 'active');
                            if ($itemOverrides->isNotEmpty()) {
                                $q->whereNotIn('menu_items.id', $itemOverrides);
                            }
                        },
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
        // Clear all versioned caches
        Cache::forget('menu_data_v1');
        Cache::forget('menu_data_v2');
        Cache::forget('menu_data_v3');
        Cache::forget('menu_data_v4');
        Cache::forget('menu_data_v5');
        Cache::forget('menu_data_v6');

        // Also clear all branch-specific caches
        try {
            $branchIds = DB::table('branches')->pluck('id');
            foreach ($branchIds as $bid) {
                Cache::forget("menu_data_v6_branch_{$bid}");
            }
        } catch (\Exception $e) {
            // Ignore if branches table issue
        }

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