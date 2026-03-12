<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Cup;
use App\Models\SubCategory;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Get cup IDs
        $smsl   = Cup::where('code', 'SM/SL')->first()?->id;
        $jr     = Cup::where('code', 'JR')->first()?->id;
        $umul   = Cup::where('code', 'UM/UL')->first()?->id;
        $pcmpcl = Cup::where('code', 'PCM/PCL')->first()?->id;

        // Build sub-category lookup by name -> id
        $sub = fn(string $name) => SubCategory::whereRaw('UPPER(name) = ?', [strtoupper($name)])->first()?->id;

        $categories = [
            // ── FOOD ─────────────────────────────────────────────
            'CHICKEN WINGS'       => ['type' => 'food', 'cup_id' => null, 'sub_category_id' => null],
            'ALA CARTE SNACKS'    => ['type' => 'food', 'cup_id' => null, 'sub_category_id' => null],
            'ALL DAY MEALS'       => ['type' => 'food', 'cup_id' => null, 'sub_category_id' => null],
            'COMBO MEALS'         => ['type' => 'food', 'cup_id' => null, 'sub_category_id' => null],
            'AFFORDA-BOWLS'       => ['type' => 'food', 'cup_id' => null, 'sub_category_id' => null],
            'WAFFLE'              => ['type' => 'food', 'cup_id' => null, 'sub_category_id' => null],

            // ── DRINKS SM/SL ──────────────────────────────────────
            'CHEESECAKE MILK TEA' => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'CREAM CHEESE MILK TEA' => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'FLAVORED MILK TEA'   => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'GREEN TEA SERIES'    => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'ICED COFFEE'         => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'OKINAWA BROWN SUGAR' => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'ROCK SALT & CHEESE'  => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'YAKULT SERIES'       => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],
            'YOGURT SERIES'       => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],

            // ── DRINKS SL only ────────────────────────────────────
            'FRUIT SODA SERIES'   => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SL')],
            'GF DUO BUNDLES'      => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SL')],
            'FP/GF FET2 CLASSIC'  => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SL')],
            'NOVA SERIES'         => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SL')],
            'PUMPKIN SPICE'       => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SL')],

            // ── DRINKS SM/SL ──────────────────────────────────────
            'CLASSIC MILKTEA'     => ['type' => 'drink', 'cup_id' => $smsl, 'sub_category_id' => $sub('SM')],

            // ── DRINKS UM/UL ──────────────────────────────────────
            'COFFEE FRAPPE'       => ['type' => 'drink', 'cup_id' => $umul, 'sub_category_id' => $sub('UM')],
            'FRAPPE SERIES'       => ['type' => 'drink', 'cup_id' => $umul, 'sub_category_id' => $sub('UM')],

            // ── DRINKS UL only ────────────────────────────────────
            'FP COFFEE BUNDLES'   => ['type' => 'drink', 'cup_id' => $umul, 'sub_category_id' => $sub('UL')],

            // ── DRINKS PCM/PCL ────────────────────────────────────
            'HOT COFFEE'          => ['type' => 'drink', 'cup_id' => $pcmpcl, 'sub_category_id' => $sub('PCM')],
            'HOT DRINKS'          => ['type' => 'drink', 'cup_id' => $pcmpcl, 'sub_category_id' => $sub('PCM')],

            // ── PROMOS ────────────────────────────────────────────
            'CARD'                => ['type' => 'promo', 'cup_id' => null, 'sub_category_id' => null],
            'FREEBIES'            => ['type' => 'promo', 'cup_id' => null, 'sub_category_id' => null],
            'PROMOS'              => ['type' => 'promo', 'cup_id' => null, 'sub_category_id' => null],
            'GRAND OPENING PROMO' => ['type' => 'promo', 'cup_id' => null, 'sub_category_id' => null],
        ];

        foreach ($categories as $name => $data) {
            Category::updateOrCreate(['name' => $name], $data);
            $this->command->info("Seeded: $name");
        }
    }
}