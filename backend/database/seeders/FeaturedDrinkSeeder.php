<?php

namespace Database\Seeders;

use App\Models\FeaturedDrink;
use Illuminate\Database\Seeder;

class FeaturedDrinkSeeder extends Seeder
{
    /**
     * Seed the featured drinks table.
     */
    public function run(): void
    {
        $drinks = [
            [
                'title'      => 'Brown Sugar Boba Milk',
                'subtitle'   => 'Our #1 Best Seller',
                'image'      => null,
                'cta_text'   => 'ORDER NOW',
                'is_active'  => true,
                'sort_order' => 1,
            ],
            [
                'title'      => 'Taro Milk Tea',
                'subtitle'   => 'Fan Favorite',
                'image'      => null,
                'cta_text'   => 'ORDER NOW',
                'is_active'  => true,
                'sort_order' => 2,
            ],
            [
                'title'      => 'Matcha Latte',
                'subtitle'   => 'Refreshing & Creamy',
                'image'      => null,
                'cta_text'   => 'ORDER NOW',
                'is_active'  => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($drinks as $drink) {
            FeaturedDrink::updateOrCreate(
                ['title' => $drink['title']],
                $drink
            );
        }
    }
}
