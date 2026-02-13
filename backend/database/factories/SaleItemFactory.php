<?php

namespace Database\Factories;

use App\Models\SaleItem;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class SaleItemFactory extends Factory
{
    protected $model = SaleItem::class;

    public function definition(): array
    {
        // Pick a random menu item to get real data
        $menuItem = MenuItem::inRandomOrder()->first();

        return [
            'menu_item_id' => $menuItem->id,
            'product_name' => $menuItem->name,
            'quantity'     => $this->faker->numberBetween(1, 3),
            'price'        => $menuItem->price,
            'final_price'  => $menuItem->price, // Simplified for factory
            'sugar_level'  => $this->faker->randomElement(['0%', '50%', '100%']),
            'size'         => $this->faker->randomElement(['M', 'L']),
            'options'      => [],
            'add_ons'      => [],
        ];
    }
}