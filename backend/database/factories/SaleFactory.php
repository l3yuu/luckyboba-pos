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
// database/factories/SaleFactory.php
public function definition(): array
{
    return [
        'total_amount'   => $this->faker->randomFloat(2, 100, 1000),
        'payment_method' => 'cash',
        'charge_type'    => $this->faker->randomElement(['grab', 'panda', null]),
        'pax'            => $this->faker->numberBetween(1, 4),
        'user_id'        => \App\Models\User::first()->id,
        'is_synced'      => false,
    ];
}
}
