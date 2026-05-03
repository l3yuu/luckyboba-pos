<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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

        // Clear branch-specific caches
        try {
            $branchIds = DB::table('branches')->pluck('id');
            foreach ($branchIds as $bid) {
                Cache::forget("menu_data_v6_branch_{$bid}");
            }
        } catch (\Exception $e) {
            // Ignore
        }

        // Bump menu version to alert connected POS clients
        Cache::put('menu_version', time());
    }
}
