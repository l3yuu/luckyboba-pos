<?php

namespace Database\Seeders;

use App\Models\AddOn;
use Illuminate\Database\Seeder;

class AddOnSeeder extends Seeder
{
    public function run(): void
    {
        $addOns = [
            // Drink add-ons (+10 for grab and panda)
            ['name' => 'Black Boba Pearl',              'price' => 15.00, 'barcode' => 'AO-5',   'category' => 'drink', 'grab_price' => 25.00, 'panda_price' => 25.00],
            ['name' => 'Mini White Pearl',              'price' => 15.00, 'barcode' => 'AO-6',   'category' => 'drink', 'grab_price' => 25.00, 'panda_price' => 25.00],
            ['name' => 'Crushed Oreo',                  'price' => 10.00, 'barcode' => 'AO-7',   'category' => 'drink', 'grab_price' => 15.00, 'panda_price' => 15.00],
            ['name' => 'Milo',                          'price' => 10.00, 'barcode' => 'AO-13',  'category' => 'drink', 'grab_price' => 15.00, 'panda_price' => 15.00],
            ['name' => 'Coffee Shot',                   'price' => 10.00, 'barcode' => 'AO-16',  'category' => 'drink', 'grab_price' => 20.00, 'panda_price' => 20.00],
            ['name' => 'Coconut Jelly',                 'price' => 25.00, 'barcode' => 'AO-21',  'category' => 'drink', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ['name' => 'Coffee Jelly',                  'price' => 25.00, 'barcode' => 'AO-9',   'category' => 'drink', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ['name' => 'Mixed Fruit Jelly',             'price' => 25.00, 'barcode' => 'AO-10',  'category' => 'drink', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ['name' => 'Premium Cream Cheese',          'price' => 30.00, 'barcode' => 'AO-3',   'category' => 'drink', 'grab_price' => 40.00, 'panda_price' => 40.00],
            ['name' => 'Premium Cheesecake',            'price' => 30.00, 'barcode' => 'AO-4',   'category' => 'drink', 'grab_price' => 40.00, 'panda_price' => 40.00],
            ['name' => 'Premium Rocksalt & Cheese',     'price' => 30.00, 'barcode' => 'AO-2',   'category' => 'drink', 'grab_price' => 40.00, 'panda_price' => 40.00],
            ['name' => 'Whip Cream',                    'price' => 20.00, 'barcode' => 'AO-14',  'category' => 'drink', 'grab_price' => 30.00, 'panda_price' => 30.00],
            ['name' => 'Cheese Mousse',                 'price' => 20.00, 'barcode' => 'AO-15',  'category' => 'drink', 'grab_price' => 30.00, 'panda_price' => 30.00],
            ['name' => 'Chia Seeds',                    'price' => 20.00, 'barcode' => 'AO-11',  'category' => 'drink', 'grab_price' => 30.00, 'panda_price' => 30.00],
            ['name' => 'Pudding',                       'price' => 25.00, 'barcode' => 'AO-20',  'category' => 'drink', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ['name' => 'Nata Jelly',                    'price' => 25.00, 'barcode' => 'AO-8',   'category' => 'drink', 'grab_price' => 35.00, 'panda_price' => 35.00],

            // Waffle combo add-ons (no grab/panda price increase)
            ['name' => 'Waffle Combo 8oz Dark Roast Coffee',  'price' => 39.00, 'barcode' => 'AO-WC1', 'category' => 'waffle', 'grab_price' => 0.00, 'panda_price' => 0.00],
            ['name' => 'Waffle Combo 12oz Dark Roast Coffee', 'price' => 49.00, 'barcode' => 'AO-WC2', 'category' => 'waffle', 'grab_price' => 0.00, 'panda_price' => 0.00],
            ['name' => 'Waffle Combo Medium Classic Pearl',   'price' => 75.00, 'barcode' => 'AO-WC3', 'category' => 'waffle', 'grab_price' => 0.00, 'panda_price' => 0.00],
            ['name' => 'Waffle Combo Large Classic Pearl',    'price' => 95.00, 'barcode' => 'AO-WC4', 'category' => 'waffle', 'grab_price' => 0.00, 'panda_price' => 0.00],
        ];

        foreach ($addOns as $addOn) {
            AddOn::updateOrCreate(
                ['barcode' => $addOn['barcode']],
                $addOn
            );
        }
    }
}