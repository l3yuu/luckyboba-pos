<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cup;

class CupSeeder extends Seeder
{
    public function run(): void
    {
        $cups = [
            ['name' => 'Standard Cup',   'size_m' => 'SM',  'size_l' => 'SL',  'code' => 'SM/SL'],
            ['name' => 'Junior Cup', 'size_m' => 'JR', 'size_l' => null, 'code' => 'JR'],
            ['name' => 'Upturn Cup',      'size_m' => 'UM',  'size_l' => 'UL',  'code' => 'UM/UL'],
            ['name' => 'Plastic Cup',     'size_m' => 'PCM', 'size_l' => 'PCL', 'code' => 'PCM/PCL'],
        ];

        foreach ($cups as $cup) {
            Cup::updateOrCreate(
                ['code' => $cup['code']],
                $cup
            );
        }
    }
}