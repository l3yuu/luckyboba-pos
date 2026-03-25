<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SugarLevel;
use App\Models\MenuItem;
use App\Models\Category;

class SugarLevelSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Seed the sugar levels ──────────────────────────────────────────

        $levels = [
            ['label' => '0%',   'value' => '0%',   'sort_order' => 1],
            ['label' => '25%',  'value' => '25%',  'sort_order' => 2],
            ['label' => '50%',  'value' => '50%',  'sort_order' => 3],
            ['label' => '75%',  'value' => '75%',  'sort_order' => 4],
            ['label' => '100%', 'value' => '100%', 'sort_order' => 5],
        ];

        foreach ($levels as $level) {
            SugarLevel::updateOrCreate(
                ['value' => $level['value']],
                [
                    'label'      => $level['label'],
                    'sort_order' => $level['sort_order'],
                    'is_active'  => true,
                ]
            );
        }

        // Delete old/unwanted levels
        SugarLevel::whereIn('value', ['125%'])->delete();
        SugarLevel::whereIn('label', ['No Sugar', '25% Sugar', '50% Sugar', '75% Sugar', 'Regular Sugar', 'Extra Sugar'])->delete();

        $this->command->info('Sugar levels seeded: ' . count($levels) . ' levels.');

        // ── 2. Define which category names get sugar levels ───────────────────

        $withSugar = [
            'CLASSIC MILKTEA',
            'LUCKY CLASSIC',
            'LUCKY CLASSIC JR',
            'CREAM CHEESE MILK TEA',
            'CHEESECAKE MILK TEA',
            'ROCK SALT & CHEESE',
            'FLAVORED MILK TEA',
            'YAKULT SERIES',
            'NOVA SERIES',
        ];

        $noSugar = [
            'ICED COFFEE',
            'FRAPPE SERIES',
            'COFFEE FRAPPE',
            'OKINAWA BROWN SUGAR',
            'GREEN TEA SERIES',
            'FRUIT SODA SERIES',
            'HOT COFFEE',
            'HOT DRINKS',
            'FP COFFEE BUNDLES',
            'HOLI-YEY',
            'PUMPKIN SPICE',
            'GF DUO BUNDLES',
            'FP/GF FET2 CLASSIC',
        ];

        // ── 3. Attach sugar levels to drink items ─────────────────────────────

        $allSugarLevelIds = SugarLevel::where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('id')
            ->toArray();

        $attachedCount = 0;
        $skippedCount  = 0;

        foreach ($withSugar as $categoryName) {
            $category = Category::where('name', $categoryName)->first();

            if (! $category) {
                $this->command->warn("Category not found: {$categoryName}");
                continue;
            }

            $items = MenuItem::where('category_id', $category->id)->get();

            foreach ($items as $item) {
                if (method_exists($item, 'sugarLevels')) {
                    $item->sugarLevels()->sync($allSugarLevelIds);
                    $attachedCount++;
                } else {
                    $skippedCount++;
                }
            }

            $this->command->info("Sugar levels attached to: {$categoryName} ({$items->count()} items)");
        }

        foreach ($noSugar as $categoryName) {
            $category = Category::where('name', $categoryName)->first();

            if (! $category) {
                $this->command->warn("Category not found (no-sugar, skipping): {$categoryName}");
                continue;
            }

            $items = MenuItem::where('category_id', $category->id)->get();

            foreach ($items as $item) {
                if (method_exists($item, 'sugarLevels')) {
                    $item->sugarLevels()->sync([]);
                }
            }

            $this->command->info("No sugar levels for: {$categoryName} ({$items->count()} items) — cleared.");
        }

        if ($skippedCount > 0) {
            $this->command->warn("{$skippedCount} items skipped — sugarLevels() relationship not found on MenuItem.");
        }

        $this->command->info("Done. {$attachedCount} items received sugar levels.");
    }
}