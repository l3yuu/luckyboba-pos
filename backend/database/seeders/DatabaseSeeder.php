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
            CategorySeeder::class,      // 1. categories first
            SubCategorySeeder::class,   // 2. then sub-categories (needs category IDs)
            VoucherSeeder::class,
            MenuSeeder::class,          // 3. then menu items (needs both)
            AddOnSeeder::class,
            DiscountSeeder::class,
            SettingSeeder::class,
            ReceiptSeeder::class,
            CashCountSeeder::class,
            RawMaterialSeeder::class,
        ]);
    }
}