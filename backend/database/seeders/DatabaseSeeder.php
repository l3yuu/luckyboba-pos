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
            CategorySeeder::class,
            SubCategorySeeder::class,
            VoucherSeeder::class,
            MenuSeeder::class,
            AddOnSeeder::class,
            DiscountSeeder::class,
            SettingSeeder::class,
            ReceiptSeeder::class,
            CashCountSeeder::class,
        ]);
    }
}