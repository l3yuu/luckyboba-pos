<?php

namespace Database\Factories;

use App\Models\Sale;
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
            // Updated to match your new OR-0000000001 format
            'si_number' => 'OR-' . str_pad($this->faker->unique()->numberBetween(1, 9999), 10, '0', STR_PAD_LEFT),
            'terminal' => '01',
            'items_count' => $this->faker->numberBetween(1, 10),
            'cashier_name' => $this->faker->randomElement(['Bina Admin', 'Cashier Ichigo', 'Admin']),
            'total_amount' => $this->faker->randomFloat(2, 50, 2000),
            'sale_id' => Sale::factory(), // Connects to a fake sale automatically
            'created_at' => now(),
        ];
    }
}