<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    /**
     * Fetch all categories and their associated menu items.
     */
    public function index()
    {
        try {
            // Cache for 10 minutes (600 seconds)
            return Cache::remember('menu_data_v1', 600, function () {
                return Category::with('menu_items')->get();
            });
        } catch (\Exception $e) {
            \Log::error('Menu fetch error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch menu',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear menu cache (optional - useful when menu is updated)
     */
    public function clearCache()
    {
        Cache::forget('menu_data_v1');
        return response()->json(['message' => 'Menu cache cleared successfully']);
    }
}