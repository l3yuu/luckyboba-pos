<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create at least one user so the transactions have an owner
        $user = \App\Models\User::factory()->create([
            'name' => 'Cashier Ichigo',
            'email' => 'cashier@luckyboba.com',
            'role' => 'cashier' // Based on your previous role setup
        ]);

        // 1. Create 10 Cash Transactions
        \App\Models\CashTransaction::factory(10)->create([
            'user_id' => $user->id, 
        ]);

        // 2. Create 30 Sales
        \App\Models\Sale::factory(30)->create()->each(function ($sale) {
            \App\Models\SaleItem::factory(rand(1, 2))->create([
                'sale_id' => $sale->id,
                'created_at' => $sale->created_at,
            ]);
        });
    }
}