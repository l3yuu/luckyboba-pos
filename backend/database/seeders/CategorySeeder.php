<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Cup;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Get cup IDs
        $smsl  = Cup::where('code', 'SM/SL')->first()?->id;
        $jr    = Cup::where('code', 'JR')->first()?->id;
        $umul  = Cup::where('code', 'UM/UL')->first()?->id;
        $pcmpcl = Cup::where('code', 'PCM/PCL')->first()?->id;

        $categories = [
            // FOOD
            "CHICKEN WINGS"       => ['type' => 'wings', 'cup_id' => null],
            "ALA CARTE SNACKS"    => ['type' => 'food',  'cup_id' => null],
            "ALL DAY MEALS"       => ['type' => 'food',  'cup_id' => null],
            "COMBO MEALS"         => ['type' => 'food',  'cup_id' => null],
            "AFFORDA-BOWLS"       => ['type' => 'food',  'cup_id' => null],
            "WAFFLE"              => ['type' => 'food',  'cup_id' => null],

            // DRINKS - SM/SL
            "CHEESECAKE MILK TEA" => ['type' => 'drink', 'cup_id' => $smsl],
            "CREAM CHEESE M. TEA" => ['type' => 'drink', 'cup_id' => $smsl],
            "FLAVORED MILK TEA"   => ['type' => 'drink', 'cup_id' => $smsl],
            "FRUIT SODA SERIES"   => ['type' => 'drink', 'cup_id' => $smsl],
            "GF DUO BUNDLES"      => ['type' => 'drink', 'cup_id' => $smsl],
            "FP/GF FET2 CLASSIC"  => ['type' => 'drink', 'cup_id' => $smsl],
            "GREEN TEA SERIES"    => ['type' => 'drink', 'cup_id' => $smsl],
            "ICED COFFEE"         => ['type' => 'drink', 'cup_id' => $smsl],
            "NOVA SERIES"         => ['type' => 'drink', 'cup_id' => $smsl],
            "OKINAWA BROWN SUGAR" => ['type' => 'drink', 'cup_id' => $smsl],
            "PUMPKIN SPICE"       => ['type' => 'drink', 'cup_id' => $smsl],
            "ROCK SALT & CHEESE"  => ['type' => 'drink', 'cup_id' => $smsl],
            "YAKULT SERIES"       => ['type' => 'drink', 'cup_id' => $smsl],
            "YOGURT SERIES"       => ['type' => 'drink', 'cup_id' => $smsl],

            // DRINKS - JR
            "CLASSIC MILKTEA"     => ['type' => 'drink', 'cup_id' => $jr],

            // DRINKS - UM/UL
            "COFFEE FRAPPE"       => ['type' => 'drink', 'cup_id' => $umul],
            "FP COFFEE BUNDLES"   => ['type' => 'drink', 'cup_id' => $umul],
            "FRAPPE SERIES"       => ['type' => 'drink', 'cup_id' => $umul],

            // DRINKS - PCM/PCL
            "HOT COFFEE"          => ['type' => 'drink', 'cup_id' => $pcmpcl],
            "HOT DRINKS"          => ['type' => 'drink', 'cup_id' => $pcmpcl],

            // PROMOS
            "CARD"                => ['type' => 'promo', 'cup_id' => null],
            "FREEBIES"            => ['type' => 'promo', 'cup_id' => null],
            "PROMOS"              => ['type' => 'promo', 'cup_id' => null],
            "GRAND OPENING PROMO" => ['type' => 'promo', 'cup_id' => null],
        ];

        foreach ($categories as $name => $data) {
            Category::updateOrCreate(
                ['name' => $name],
                $data
            );
        }
    }
}