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
        // 1. Create the Categories and Menu Items first
        $this->call([
            CategorySeeder::class,
            MenuSeeder::class, // <--- ADD THIS LINE HERE
        ]);

        // 2. Create at least one user so the transactions have an owner
        $user = \App\Models\User::factory()->create([
            'name' => 'Cashier Ichigo',
            'email' => 'cashier@luckyboba.com',
            'role' => 'cashier' 
        ]);

        // 3. Create 10 Cash Transactions
        \App\Models\CashTransaction::factory(10)->create([
            'user_id' => $user->id, 
        ]);

        // 4. Create 30 Sales
        \App\Models\Sale::factory(30)->create()->each(function ($sale) {
            \App\Models\SaleItem::factory(rand(1, 2))->create([
                'sale_id' => $sale->id,
                'created_at' => $sale->created_at,
            ]);
        });

        // 5. Add other seeders
        $this->call([
            CashCountSeeder::class,
        ]);
    }
}