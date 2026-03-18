<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BranchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Lucky Boba - ' . fake()->city(),
            'location' => fake()->address(),
            'status' => 'active',
            'total_sales' => 0.00,
            'today_sales' => 0.00,
        ];
    }
}