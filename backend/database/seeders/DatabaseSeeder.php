<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create branches FIRST
        $branch = Branch::create([
            'name' => 'Lucky Boba - SM City',
            'location' => 'SM City Mall',
            'status' => 'active',
        ]);

        // Create at least one user so the transactions have an owner
        $user = \App\Models\User::factory()->create([
            'name' => 'Cashier Ichigo',
            'email' => 'cashier@luckyboba.com',
            'role' => 'cashier',
            'branch_id' => $branch->id, // Assign the branch
        ]);

        // 1. Create 10 Cash Transactions
        \App\Models\CashTransaction::factory(10)->create([
            'user_id' => $user->id, 
        ]);

        // 2. Create 30 Sales
        \App\Models\Sale::factory(30)->create([
            'branch_id' => $branch->id, // If your sales have branch_id
        ])->each(function ($sale) {
            \App\Models\SaleItem::factory(rand(1, 2))->create([
                'sale_id' => $sale->id,
                'created_at' => $sale->created_at,
            ]);
        });

        // 3. Add the Cash Count Seeder here
        $this->call([
            CashCountSeeder::class,
        ]);
    }
}