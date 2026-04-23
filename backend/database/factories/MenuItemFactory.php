<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => $this->faker->words(3, true),
            'price' => $this->faker->randomFloat(2, 50, 200),
            'cost' => $this->faker->randomFloat(2, 20, 100),
            'quantity' => $this->faker->numberBetween(0, 100),
            'barcode' => $this->faker->unique()->ean13(),
            'status' => 'active',
        ];
    }
}
