<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CategoryDrink;
use App\Models\Category;
use App\Models\MenuItem;

class CategoryDrinkSeeder extends Seeder
{
    public function run(): void
    {
        $category = Category::where('name', 'MIX & MATCH')->first();

        if (!$category) {
            $this->command->warn('MIX & MATCH category not found. Skipping CategoryDrinkSeeder.');
            return;
        }

        // barcode => size
        $drinks = [
            'HDL1'   => 'L', // HOT CHOCOLATE (L)
            'CMM2'   => 'M', // CLASSIC PEARL (M)
            'BCCKM1' => 'M', // BELGIAN CHOCO M. TEA + CHEESECAKE (M)
            'ICM6'   => 'M', // ICED CARAMEL MACCHIATO (M)
            'YSM1'   => 'M', // GREEN APPLE YAKULT (M)
            'FLMM4'  => 'M', // WINTERMELON MILK TEA (M)
        ];

        // Clear existing pool
        CategoryDrink::where('category_id', $category->id)->delete();

        $seeded = 0;

        foreach ($drinks as $barcode => $size) {
            $menuItem = MenuItem::where('barcode', $barcode)->first();

            if (!$menuItem) {
                $this->command->warn("  Not found (barcode: {$barcode})");
                continue;
            }

            CategoryDrink::updateOrCreate(
                [
                    'category_id'  => $category->id,
                    'menu_item_id' => $menuItem->id,
                ],
                ['size' => $size]
            );

            $this->command->info("  Seeded: {$menuItem->name} ({$size}) [{$barcode}]");
            $seeded++;
        }

        $this->command->info("CategoryDrinkSeeder done — {$seeded} drinks added to MIX & MATCH pool.");
    }
}