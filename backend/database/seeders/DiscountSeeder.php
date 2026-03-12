<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Discount;

class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('discount_branches')->truncate();
        DB::table('discounts')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $discounts = [
            ['name' => '10% OFF PROMO',    'amount' => 10,  'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => '10% OFF PROMO',    'amount' => 10,  'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => '20% VOUCHER',      'amount' => 20,  'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => '20% VOUCHER',      'amount' => 20,  'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => '25% VOUCHER',      'amount' => 25,  'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => '25% VOUCHER',      'amount' => 25,  'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => 'FREE ITEM',        'amount' => 100, 'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => 'LUCKY CARD - 10%', 'amount' => 10,  'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => 'LUCKY CARD - 10%', 'amount' => 10,  'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => 'LUCKY CARD - BOGO','amount' => 50,  'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => 'STUDENT_DISCOUNT', 'amount' => 10,  'status' => 'ON', 'type' => 'Item-Percent'],
        ];

        foreach ($discounts as $discount) {
            Discount::create($discount);
        }
    }
}