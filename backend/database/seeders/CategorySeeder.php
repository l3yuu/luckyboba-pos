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
        $smsl   = Cup::where('code', 'SM/SL')->first()?->id;
        $jr     = Cup::where('code', 'JR')->first()?->id;
        $umul   = Cup::where('code', 'UM/UL')->first()?->id;
        $pcmpcl = Cup::where('code', 'PCM/PCL')->first()?->id;

        $sub = fn(string $name) => SubCategory::whereRaw('UPPER(name) = ?', [strtoupper($name)])->first()?->id;

        $categories = [
            // ── FOOD ─────────────────────────────────────────────────────────
            'CHICKEN WINGS'        => ['type' => 'food',  'category_type' => 'wings',  'cup_id' => null, 'sub_category_id' => null],
            'ALA CARTE SNACKS'     => ['type' => 'food',  'category_type' => 'food',   'cup_id' => null, 'sub_category_id' => null],
            'ALL DAY MEALS'        => ['type' => 'food',  'category_type' => 'food',   'cup_id' => null, 'sub_category_id' => null],
            'AFFORDA-BOWLS'        => ['type' => 'food',  'category_type' => 'food',   'cup_id' => null, 'sub_category_id' => null],
            'WAFFLE'               => ['type' => 'food',  'category_type' => 'waffle', 'cup_id' => null, 'sub_category_id' => null],
            'PIZZA PEDRICOS'       => ['type' => 'food',  'category_type' => 'food',   'cup_id' => null, 'sub_category_id' => null],

            // ── COMBO (food + drink) ──────────────────────────────────────────
            'COMBO MEALS'          => ['type' => 'food',  'category_type' => 'combo',  'cup_id' => null, 'sub_category_id' => null],
            'PIZZA PEDRICOS COMBO' => ['type' => 'food',  'category_type' => 'combo',  'cup_id' => null, 'sub_category_id' => null],
            'MIX & MATCH'          => ['type' => 'food', 'category_type' => 'mix_and_match', 'cup_id' => null, 'sub_category_id' => null],

            // ── DRINKS SM/SL ──────────────────────────────────────────────────
            'CHEESECAKE MILK TEA'    => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'CREAM CHEESE MILK TEA'  => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'FLAVORED MILK TEA'      => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'GREEN TEA SERIES'       => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'ICED COFFEE'            => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'OKINAWA BROWN SUGAR'    => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'ROCK SALT & CHEESE'     => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'YAKULT SERIES'          => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'YOGURT SERIES'          => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],
            'CLASSIC MILKTEA'        => ['type' => 'drink', 'category_type' => 'drink', 'cup_id' => $smsl,   'sub_category_id' => $sub('SM')],

            // ── DRINKS SM/SL (SL only) ────────────────────────────────────────
            'FRUIT SODA SERIES'      => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $smsl,   'sub_category_id' => $sub('SL')],
            'NOVA SERIES'            => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $smsl,   'sub_category_id' => $sub('SL')],
            'PUMPKIN SPICE'          => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $smsl,   'sub_category_id' => $sub('SL')],

            // ── BUNDLES SM/SL (drink bundles — all drinks, no food) ───────────
            'GF DUO BUNDLES'         => ['type' => 'drink', 'category_type' => 'bundle', 'cup_id' => $smsl,   'sub_category_id' => $sub('SL')],
            'FP/GF FET2 CLASSIC'     => ['type' => 'drink', 'category_type' => 'bundle', 'cup_id' => $smsl,   'sub_category_id' => $sub('SL')],

            // ── DRINKS JR ─────────────────────────────────────────────────────
            'LUCKY CLASSIC JR'       => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $jr,     'sub_category_id' => $sub('JR')],

            // ── DRINKS UM/UL ──────────────────────────────────────────────────
            'COFFEE FRAPPE'          => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $umul,   'sub_category_id' => $sub('UM')],
            'FRAPPE SERIES'          => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $umul,   'sub_category_id' => $sub('UM')],

            // ── BUNDLES UM/UL ─────────────────────────────────────────────────
            'FP COFFEE BUNDLES'      => ['type' => 'drink', 'category_type' => 'bundle', 'cup_id' => $umul,   'sub_category_id' => $sub('UL')],
            'HOLI-YEY'               => ['type' => 'drink', 'category_type' => 'bundle', 'cup_id' => $umul,   'sub_category_id' => $sub('UL')],

            // ── DRINKS PCM/PCL ────────────────────────────────────────────────
            'HOT COFFEE'             => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $pcmpcl, 'sub_category_id' => $sub('PCM')],
            'HOT DRINKS'             => ['type' => 'drink', 'category_type' => 'drink',  'cup_id' => $pcmpcl, 'sub_category_id' => $sub('PCM')],

            // ── PROMOS ────────────────────────────────────────────────────────
            'CARD'                   => ['type' => 'promo', 'category_type' => 'promo',  'cup_id' => null, 'sub_category_id' => null],
            'FREEBIES'               => ['type' => 'promo', 'category_type' => 'promo',  'cup_id' => null, 'sub_category_id' => null],
            'PROMOS'                 => ['type' => 'promo', 'category_type' => 'promo',  'cup_id' => null, 'sub_category_id' => null],
            'GRAND OPENING PROMO'    => ['type' => 'promo', 'category_type' => 'promo',  'cup_id' => null, 'sub_category_id' => null],
        ];

        foreach ($categories as $name => $data) {
            Category::updateOrCreate(['name' => $name], $data);
            $this->command->info("Seeded: $name");
        }
    }
}