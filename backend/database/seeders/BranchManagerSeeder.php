<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CupSeeder::class,
            CategorySeeder::class,          // 1. categories first
            SubCategorySeeder::class,       // 2. then sub-categories (needs category IDs)
            CategoryDrinkSeeder::class,
            VoucherSeeder::class,
            MenuSeeder::class,              // 3. then menu items (needs both)
            MenuItemImageSeeder::class,
            MenuItemOptionSeeder::class,
            SugarLevelSeeder::class,
            BundleSeeder::class,
            AddOnSeeder::class,
            DiscountSeeder::class,
            FeaturedDrinkSeeder::class,
            SettingSeeder::class,
            PointsSystemSeeder::class,
            RawMaterialSeeder::class,
            RecipeSeeder::class,
            CashCountSeeder::class,
            CardSeeder::class,
            CustomerSeeder::class,
        ]);
    }
}