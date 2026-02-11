<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Model>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'total_amount' => fake()->randomFloat(2, 85, 500), // Random Boba price
            'payment_method' => 'cash',
            'is_synced' => false,
            'created_at' => fake()->dateTimeBetween('-1 month', 'now'), // Mix of old and new data
        ];
    }
}
