<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedDefaultCards extends Command
{
    protected $signature = 'cards:seed-defaults';
    protected $description = 'Seed the default membership and promo cards into the database';

    public function handle()
    {
        $this->info('🃏 Seeding default cards into database...');

        $cards = [
            [
                'title' => 'Normal Card',
                'image' => 'cards/normal_card.png',
                'price' => 300.00,
                'is_active' => true,
                'sort_order' => 1,
                'available_months' => json_encode(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']),
            ],
            [
                'title' => 'Student Card',
                'image' => 'cards/student_card.png',
                'price' => 250.00,
                'is_active' => true,
                'sort_order' => 2,
                'available_months' => json_encode(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']),
            ],
            [
                'title' => 'Birthday Card',
                'image' => 'cards/birthday_card.png',
                'price' => 200.00,
                'is_active' => true,
                'sort_order' => 3,
                'available_months' => json_encode(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']),
            ],
            [
                'title' => 'Summer Card',
                'image' => 'cards/summer_card.png',
                'price' => 350.00,
                'is_active' => true,
                'sort_order' => 4,
                'available_months' => json_encode(['Mar','Apr','May']),
            ],
            [
                'title' => 'Valentines Card',
                'image' => 'cards/valentines_card.png',
                'price' => 400.00,
                'is_active' => true,
                'sort_order' => 5,
                'available_months' => json_encode(['Feb']),
            ]
        ];

        foreach ($cards as $card) {
            // Check if card already exists to avoid duplicates
            $exists = DB::table('cards')->where('title', $card['title'])->first();
            
            if (!$exists) {
                DB::table('cards')->insert([
                    'title' => $card['title'],
                    'image' => $card['image'],
                    'price' => $card['price'],
                    'is_active' => $card['is_active'],
                    'sort_order' => $card['sort_order'],
                    'available_months' => $card['available_months'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->line("  ✅ Created: {$card['title']}");
            } else {
                $this->line("  ⏩ Skipped: {$card['title']} (Already exists)");
            }
        }

        $this->info('✨ Done! Cards are now available and images are linked.');
        return Command::SUCCESS;
    }
}
