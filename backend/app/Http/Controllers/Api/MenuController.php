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
            return Cache::remember('menu_data_v3', 600, function () {
                return Category::with(['cup', 'subCategories', 'menu_items'])
                    ->orderBy('name', 'asc')
                    ->get()
                    ->map(function ($cat) {
                        $subCategories = $cat->subCategories->sortBy('name')->values();
                        
                        return [
                            'id'            => $cat->id,
                            'name'          => $cat->name,
                            'type'          => $cat->type,
                            'cup'           => $cat->cup,
                            'sub_categories' => $subCategories->map(fn($s) => [
                                'id'   => $s->id,
                                'name' => $s->name,
                            ]),
                            'menu_items'    => $cat->menu_items->map(fn($item) => [
                                'id'              => $item->id,
                                'name'            => $item->name,
                                'price'           => $item->price,
                                'barcode'         => $item->barcode,
                                'size'            => $item->size,
                                'sub_category_id' => $item->sub_category_id,  // ← include this
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
        return response()->json(['message' => 'Menu cache cleared successfully']);
    }
}