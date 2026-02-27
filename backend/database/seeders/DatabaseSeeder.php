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
        // 1. Create foundational data ONLY
        // These are required for the POS to actually function
        $this->call([
            UserSeeder::class, 
            CategorySeeder::class,
            SubCategorySeeder::class,
            VoucherSeeder::class,
            MenuSeeder::class,
            AddOnSeeder::class,
        ]);

        // 2. Add system configurations or initial balances
        $this->call([
            CashCountSeeder::class, // Seeds the starting drawer balance
        ]);

        /* 
         * DELETED: CashTransaction factory
         * DELETED: Sale factory logic
         * DELETED: Receipt factory logic
         * 
         * The sales, sale_items, and receipts tables will now be EMPTY 
         * until you make a real transaction in the Sales Order page.
         */
    }
}