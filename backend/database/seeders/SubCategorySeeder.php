<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubCategory;
use App\Models\Category;
use App\Models\Cup;

class SubCategorySeeder extends Seeder
{
    public function run(): void
    {
        SubCategory::whereIn('name', ['8oz', '12oz'])->delete();
        $mapping = [
            'FRAPPE SERIES'     => ['(UL)', '(UM)', '(SM)'],
            'CLASSIC MILKTEA'   => ['(SM)', '(SL)'],
            'FLAVORED MILK TEA' => ['(SM)', '(SL)'],
            'HOT DRINKS'        => ['PCM', 'PCL'],
            'HOT COFFEE'        => ['PCM', 'PCL'],
            'CHICKEN WINGS'     => ['3pc', '4pc', '6pc', '12pc'],
        ];

        // Build lookup: size_m/size_l -> cup_id
        $cupLookup = [];
        Cup::all()->each(function ($cup) use (&$cupLookup) {
            if ($cup->size_m) $cupLookup[$cup->size_m] = $cup->id;
            if ($cup->size_l) $cupLookup[$cup->size_l] = $cup->id;
        });

        foreach ($mapping as $mainCatName => $subs) {
            $category = Category::where('name', $mainCatName)->first();

            if ($category) {
                foreach ($subs as $subName) {
                    $cleanName = trim($subName, '()');
                    $cupId = $cupLookup[$cleanName] ?? null;

                    SubCategory::updateOrCreate(
                        [
                            'name'        => $subName,
                            'category_id' => $category->id,
                        ],
                        [
                            'name'    => $subName,
                            'cup_id'  => $cupId,
                        ]
                    );
                }
                $this->command->info("Seeded subs for: $mainCatName");
            } else {
                $this->command->warn("Category not found: $mainCatName");
            }
        }
    }
}