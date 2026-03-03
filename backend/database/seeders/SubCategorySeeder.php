<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubCategory;
use App\Models\Category;

class SubCategorySeeder extends Seeder
{
    public function run(): void
    {
        // Define the specific sub-categories for specific main categories
        $mapping = [
            'FRAPPE SERIES' => ['(UL)', '(UM)', '(SM)'],
            'CLASSIC MILKTEA' => ['(SM)', '(SL)'],
            'FLAVORED MILK TEA' => ['(SM)', '(SL)'],
            'HOT DRINKS' => ['8oz', '12oz'],
            'HOT COFFEE' => ['8oz', '12oz'],
            'CHICKEN WINGS' => ['4PC', '6PC'],
        ];

        foreach ($mapping as $mainCatName => $subs) {
            $category = Category::where('name', $mainCatName)->first();

            if ($category) {
                foreach ($subs as $subName) {
                    SubCategory::updateOrCreate(
                        [
                            'name' => $subName,
                            'category_id' => $category->id
                        ],
                        ['name' => $subName]
                    );
                }
                $this->command->info("Seeded subs for: $mainCatName");
            } else {
                $this->command->warn("Category not found: $mainCatName");
            }
        }
    }
}