<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            "Add Ons Sinkers", "AFFORDA-BOWLS", "ALA CARTE SNACKS", "ALL DAY MEALS", "CARD",
            "CHEESECAKE MILK TEA", "CHICKEN WINGS", "CLASSIC MILKTEA", "COFFEE FRAPPE", "COMBO MEALS",
            "CREAM CHEESE M. TEA", "FLAVORED MILK TEA", "FP COFFEE BUNDLES", "FP/GF FET2 CLASSIC", "FRAPPE SERIES",
            "FREEBIES", "FRUIT SODA SERIES", "GF DUO BUNDLES", "GRAND OPENING PROMO", "GREEN TEA SERIES",
            "HOT COFFEE", "HOT DRINKS", "ICED COFFEE", "NOVA SERIES", "OKINAWA BROWN SUGAR",
            "PROMOS", "PUMPKIN SPICE", "ROCK SALT & CHEESE", "WAFFLE", "YAKULT SERIES", "YOGURT SERIES"
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['name' => $cat], // Prevents duplicates if you run it twice
                ['type' => $this->getCategoryType($cat)]
            );
        }
    }

    private function getCategoryType($name) 
    {
        // Identifying which ones are drinks for your frontend logic
        $drinks = [
            "CHEESECAKE MILK TEA", "CLASSIC MILKTEA", "COFFEE FRAPPE", 
            "CREAM CHEESE M. TEA", "FLAVORED MILK TEA", "FRAPPE SERIES", 
            "GREEN TEA SERIES", "ICED COFFEE", "OKINAWA BROWN SUGAR", 
            "ROCK SALT & CHEESE", "YAKULT SERIES"
        ];

        return in_array($name, $drinks) ? 'drink' : 'standard';
    }
}