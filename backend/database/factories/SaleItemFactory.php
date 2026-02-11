<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Model>
 */
class SaleItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $products = ['Classic Milk Tea', 'Taro Boba', 'Wintermelon', 'Matcha Latte'];
        return [
            'product_name' => fake()->randomElement($products),
            'quantity' => fake()->numberBetween(1, 3),
            'price' => 95.00,
            'created_at' => fake()->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
