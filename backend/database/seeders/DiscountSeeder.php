<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Discount;

class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        $discounts = [
            ['name' => '10% OFF PROMO', 'amount' => 10, 'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => '10% OFF PROMO', 'amount' => 10, 'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => '20% VOUCHER', 'amount' => 10, 'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => '20% VOUCHER', 'amount' => 10, 'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => '25% VOUCHER', 'amount' => 10, 'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => '25% VOUCHER', 'amount' => 10, 'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => 'FREE ITEM', 'amount' => 10, 'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => 'LUCKY CARD - 10%', 'amount' => 10, 'status' => 'ON', 'type' => 'Global-Percent'],
            ['name' => 'LUCKY CARD - 10%', 'amount' => 10, 'status' => 'ON', 'type' => 'Item-Percent'],
            ['name' => 'LUCKY CARD - BOGO', 'amount' => 25, 'status' => 'ON', 'type' => 'Item-Percent'],
        ];

        foreach ($discounts as $discount) {
            Discount::create($discount);
        }
    }
}