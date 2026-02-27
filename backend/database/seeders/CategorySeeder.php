<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // FOOD
            "CHICKEN WINGS"       => 'wings',
            "ALA CARTE SNACKS"    => 'food',
            "ALL DAY MEALS"       => 'food',
            "COMBO MEALS"         => 'food',
            "AFFORDA-BOWLS"       => 'food',
            "WAFFLE"              => 'food',

            // DRINKS
            "CHEESECAKE MILK TEA" => 'drink',
            "CLASSIC MILKTEA"     => 'drink',
            "COFFEE FRAPPE"       => 'drink',
            "CREAM CHEESE M. TEA" => 'drink',
            "FLAVORED MILK TEA"   => 'drink',
            "FP COFFEE BUNDLES"   => 'drink',
            "FP/GF FET2 CLASSIC"  => 'drink',
            "FRAPPE SERIES"       => 'drink',
            "FRUIT SODA SERIES"   => 'drink',
            "GF DUO BUNDLES"      => 'drink',
            "GREEN TEA SERIES"    => 'drink',
            "HOT COFFEE"          => 'drink',
            "HOT DRINKS"          => 'drink',
            "ICED COFFEE"         => 'drink',
            "NOVA SERIES"         => 'drink',
            "OKINAWA BROWN SUGAR" => 'drink',
            "PUMPKIN SPICE"       => 'drink',
            "ROCK SALT & CHEESE"  => 'drink',
            "YAKULT SERIES"       => 'drink',
            "YOGURT SERIES"       => 'drink',

            // PROMOS
            "CARD"                => 'promo',
            "FREEBIES"            => 'promo',
            "PROMOS"              => 'promo',
            "GRAND OPENING PROMO" => 'promo',
        ];

        foreach ($categories as $name => $type) {
            Category::updateOrCreate(
                ['name' => $name],
                ['type' => $type]
            );
        }
    }
}