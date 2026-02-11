<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CashTransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            // user_id is usually handled in the Seeder, but we define other fields here
            'type' => fake()->randomElement(['cash_in', 'cash_out', 'cash_drop']),
            'amount' => fake()->randomFloat(2, 100, 2000), // Generates a random amount
            'note' => fake()->sentence(),
            'is_synced' => false,
        ];
    }
}