<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait MenuCache
{
    /**
     * Clear all versions of the menu data cache to ensure POS stays in sync.
     */
    public function clearMenuCache(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            Cache::forget("menu_data_v{$i}");
        }
        
        // Also clear any other related caches if they exist
        Cache::forget('menu_data');
    }
}
