<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReceiptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Receipt::create([
            'si_number' => 'SI-001',
            'terminal' => '01',
            'items_count' => 5,
            'cashier_name' => 'Admin QCU',
            'total_amount' => 150.75,
            'created_at' => now(),
        ]);
    }
}
