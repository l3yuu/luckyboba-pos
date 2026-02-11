<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Receipt>
 */
class ReceiptFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'si_number' => 'SI-' . $this->faker->unique()->numberBetween(1000, 9999),
            'terminal' => '01',
            'items_count' => $this->faker->numberBetween(1, 10),
            'cashier_name' => 'ADMIN',
            'total_amount' => $this->faker->randomFloat(2, 50, 2000),
            'created_at' => now(),
        ];
    }
}
