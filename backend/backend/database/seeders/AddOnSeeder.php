<?php

namespace Database\Seeders;

use App\Models\AddOn;
use Illuminate\Database\Seeder;

class AddOnSeeder extends Seeder
{
    public function run(): void
    {
        $addOns = [
            // Drink add-ons
            ['name' => 'Black Boba Pearl',              'price' => 15.00, 'barcode' => 'AO-5',   'category' => 'drink'],
            ['name' => 'Mini White Pearl',              'price' => 15.00, 'barcode' => 'AO-6',   'category' => 'drink'],
            ['name' => 'Crushed Oreo',                  'price' => 10.00, 'barcode' => 'AO-7',   'category' => 'drink'],
            ['name' => 'Milo',                          'price' => 10.00, 'barcode' => 'AO-13',  'category' => 'drink'],
            ['name' => 'Coffee Shot',                   'price' => 10.00, 'barcode' => 'AO-16',  'category' => 'drink'],
            ['name' => 'Coconut Jelly',                 'price' => 25.00, 'barcode' => 'AO-21',  'category' => 'drink'],
            ['name' => 'Coffee Jelly',                  'price' => 25.00, 'barcode' => 'AO-9',   'category' => 'drink'],
            ['name' => 'Mixed Fruit Jelly',             'price' => 25.00, 'barcode' => 'AO-10',  'category' => 'drink'],
            ['name' => 'Premium Cream Cheese',          'price' => 30.00, 'barcode' => 'AO-3',   'category' => 'drink'],
            ['name' => 'Premium Cheesecake',            'price' => 30.00, 'barcode' => 'AO-4',   'category' => 'drink'],
            ['name' => 'Premium Rocksalt & Cheese',     'price' => 30.00, 'barcode' => 'AO-2',   'category' => 'drink'],
            ['name' => 'Whip Cream',                    'price' => 20.00, 'barcode' => 'AO-14',  'category' => 'drink'],
            ['name' => 'Cheese Mousse',                 'price' => 20.00, 'barcode' => 'AO-15',  'category' => 'drink'],
            ['name' => 'Chia Seeds',                    'price' => 20.00, 'barcode' => 'AO-11',  'category' => 'drink'],
            ['name' => 'Pudding',                       'price' => 25.00, 'barcode' => 'AO-20',  'category' => 'drink'],

            // Waffle combo add-ons
            ['name' => 'Waffle Combo 8oz Dark Roast Coffee',  'price' => 39.00, 'barcode' => 'AO-WC1', 'category' => 'waffle'],
            ['name' => 'Waffle Combo 12oz Dark Roast Coffee', 'price' => 49.00, 'barcode' => 'AO-WC2', 'category' => 'waffle'],
            ['name' => 'Waffle Combo Medium Classic Pearl',   'price' => 75.00, 'barcode' => 'AO-WC3', 'category' => 'waffle'],
            ['name' => 'Waffle Combo Large Classic Pearl',    'price' => 95.00, 'barcode' => 'AO-WC4', 'category' => 'waffle'],
        ];

        foreach ($addOns as $addOn) {
            AddOn::updateOrCreate(
                ['barcode' => $addOn['barcode']],
                $addOn
            );
        }
    }
}