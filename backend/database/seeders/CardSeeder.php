<?php

namespace Database\Seeders;

use App\Models\Card;
use Illuminate\Database\Seeder;

class CardSeeder extends Seeder
{
    /**
     * Seed the cards table.
     */
    public function run(): void
    {
        $cards = [
            [
                'title'            => 'VIP Privilege Card',
                'image'            => 'assets/images/vip_card.png',
                'price'            => 1500.00,
                'is_active'        => true,
                'sort_order'       => 1,
                'available_months' => '12',
            ],
            [
                'title'            => 'Student Discount Card',
                'image'            => 'assets/images/student_card.png',
                'price'            => 300.00,
                'is_active'        => true,
                'sort_order'       => 2,
                'available_months' => '6',
            ],
            [
                'title'            => 'Platinum Member Card',
                'image'            => 'assets/images/platinum_card.png',
                'price'            => 3000.00,
                'is_active'        => true,
                'sort_order'       => 3,
                'available_months' => '24',
            ],
        ];

        foreach ($cards as $card) {
            Card::updateOrCreate(
                ['title' => $card['title']],
                $card
            );
        }
    }
}
