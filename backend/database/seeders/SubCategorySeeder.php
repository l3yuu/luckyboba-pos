<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubCategory;
use App\Models\Category;
use App\Models\Cup;
use Illuminate\Support\Facades\DB;

class SubCategorySeeder extends Seeder
{
public function run(): void
{
    // ── Step 1: Migrate old parenthesised records to clean names ──────────
    $renames = [
        '(SM)' => 'SM',
        '(SL)' => 'SL',
        '(UL)' => 'UL',
        '(UM)' => 'UM',
    ];

    foreach ($renames as $oldName => $newName) {
        $oldSubs = SubCategory::where('name', $oldName)->get();

        foreach ($oldSubs as $oldSub) {
            // Find or create the clean-named sub under the same category
            $newSub = SubCategory::where('name', $newName)
                ->where('category_id', $oldSub->category_id)
                ->first();

            if ($newSub) {
                // Re-point all menu_items from old sub to new sub
                DB::table('menu_items')
                    ->where('sub_category_id', $oldSub->id)
                    ->update(['sub_category_id' => $newSub->id]);

                $this->command->info("Migrated menu_items from [{$oldName}] → [{$newName}] (category_id: {$oldSub->category_id})");
            }

            // Delete the old record
            $oldSub->delete();
            $this->command->info("Deleted old sub-category: {$oldName} (id: {$oldSub->id})");
        }
    }

    // ── Step 2: Normal mapping ─────────────────────────────────────────────
    $mapping = [
        'CHEESECAKE MILK TEA'  => ['SM', 'SL'],
        'CREAM CHEESE M. TEA'  => ['SM', 'SL'],
        'FLAVORED MILK TEA'    => ['SM', 'SL'],
        'GREEN TEA SERIES'     => ['SM', 'SL'],
        'ICED COFFEE'          => ['SM', 'SL'],
        'OKINAWA BROWN SUGAR'  => ['SM', 'SL'],
        'ROCK SALT & CHEESE'   => ['SM', 'SL'],
        'YAKULT SERIES'        => ['SM', 'SL'],
        'YOGURT SERIES'        => ['SM', 'SL'],
        'FP/GF FET2 CLASSIC'   => ['SL'],
        'FRUIT SODA SERIES'    => ['SL'],
        'GF DUO BUNDLES'       => ['SL'],
        'NOVA SERIES'          => ['SL'],
        'PUMPKIN SPICE'        => ['SL'],
        'CLASSIC MILKTEA'      => ['SM', 'SL'],
        'COFFEE FRAPPE'        => ['UM', 'UL'],
        'FRAPPE SERIES'        => ['UM', 'UL'],
        'FP COFFEE BUNDLES'    => ['UL'],
        'HOT COFFEE'           => ['PCM', 'PCL'],
        'HOT DRINKS'           => ['PCM', 'PCL'],
        'CHICKEN WINGS'        => ['3pc', '4pc', '6pc', '12pc'],
    ];

    $smslId = Cup::where('code', 'SM/SL')->first()?->id;
    $jrId   = Cup::where('code', 'JR')->first()?->id;
    $umulId = Cup::where('code', 'UM/UL')->first()?->id;
    $pcmId  = Cup::where('code', 'PCM/PCL')->first()?->id;

    $cupLookup = [
        'SM'  => $smslId,
        'SL'  => $smslId,
        'JR'  => $jrId,
        'UM'  => $umulId,
        'UL'  => $umulId,
        'PCM' => $pcmId,
        'PCL' => $pcmId,
        '3pc'  => null,
        '4pc'  => null,
        '6pc'  => null,
        '12pc' => null,
    ];

    foreach ($mapping as $mainCatName => $subNames) {
        $category = Category::whereRaw('UPPER(name) = ?', [strtoupper($mainCatName)])->first();

        if (!$category) {
            $this->command->warn("Category not found: $mainCatName");
            continue;
        }

        $firstSubId = null;

        foreach ($subNames as $subName) {
            $sub = SubCategory::updateOrCreate(
                [
                    'name'        => $subName,
                    'category_id' => $category->id,
                ],
                [
                    'cup_id' => $cupLookup[$subName] ?? null,
                ]
            );

            if ($firstSubId === null) {
                $firstSubId = $sub->id;
            }
        }

        DB::table('categories')
            ->where('id', $category->id)
            ->update(['sub_category_id' => $firstSubId]);

        $this->command->info("Seeded [{$mainCatName}] → sub_category_id = {$firstSubId}");
    }
}
}