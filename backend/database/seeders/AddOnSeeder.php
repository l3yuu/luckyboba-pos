<?php

namespace Database\Seeders;

use App\Models\AddOn;
use Illuminate\Database\Seeder;

class AddOnSeeder extends Seeder
{
    public function run(): void
    {
        $addOns = [
            ['name' => 'Mini White Marshmallow',        'price' => 15.00, 'barcode' => 'AO-1'],
            ['name' => 'Premium Rocksalt & Cheesecake', 'price' => 25.00, 'barcode' => 'AO-2'],
            ['name' => 'Premium Cream Cheese',          'price' => 25.00, 'barcode' => 'AO-3'],
            ['name' => 'Premium Cheese Cake',           'price' => 25.00, 'barcode' => 'AO-4'],
            ['name' => 'Black Boba Pearl',              'price' => 15.00, 'barcode' => 'AO-5'],
            ['name' => 'Mini White Pearl',              'price' => 15.00, 'barcode' => 'AO-6'],
            ['name' => 'Crushed Oreo',                  'price' => 20.00, 'barcode' => 'AO-7'],
            ['name' => 'Nata Jelly',                    'price' => 15.00, 'barcode' => 'AO-8'],
            ['name' => 'Coffee Jelly',                  'price' => 15.00, 'barcode' => 'AO-9'],
            ['name' => 'Mixed Fruit Jelly',             'price' => 15.00, 'barcode' => 'AO-10'],
            ['name' => 'Chia Seeds',                    'price' => 20.00, 'barcode' => 'AO-11'],
            ['name' => 'Non Dairy Milk',                'price' => 20.00, 'barcode' => 'AO-12'],
            ['name' => 'Milo',                          'price' => 20.00, 'barcode' => 'AO-13'],
            ['name' => 'Whip Cream',                    'price' => 20.00, 'barcode' => 'AO-14'],
            ['name' => 'Cheese Mousse',                 'price' => 25.00, 'barcode' => 'AO-15'],
            ['name' => 'Coffee Shot',                   'price' => 20.00, 'barcode' => 'AO-16'],
            ['name' => 'Sugar Sachet',                  'price' =>  5.00, 'barcode' => 'AO-17'],
            ['name' => 'Creamer Sachet',                'price' =>  5.00, 'barcode' => 'AO-18'],
            ['name' => 'Sticky Rice',                   'price' => 20.00, 'barcode' => 'AO-19'],
            ['name' => 'Egg Pudding',                   'price' => 20.00, 'barcode' => 'AO-20'],
        ];

        foreach ($addOns as $addOn) {
            AddOn::updateOrCreate(
                ['barcode' => $addOn['barcode']],
                $addOn
            );
        }
    }
}