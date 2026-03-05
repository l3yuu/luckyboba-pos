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
                return Category::with(['menu_items', 'cup', 'subCategories'])
                    ->orderBy('name', 'asc')
                    ->get()
                    ->map(function ($cat) {
                        $arr = $cat->toArray();
                        $arr['sub_categories'] = $cat->subCategories
                            ->sortBy('name')
                            ->map(fn($s) => [
                                'id'   => $s->id,
                                'name' => $s->name,
                            ])
                            ->values();
                        return $arr;
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