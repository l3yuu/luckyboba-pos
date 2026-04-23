<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager = User::factory()->create([
            'role' => 'branch_manager',
            'status' => 'ACTIVE',
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_list_inventory(): void
    {
        $category = Category::factory()->create(['type' => 'drink']);
        MenuItem::factory()->count(3)->create(['category_id' => $category->id]);

        $response = $this->actingAs($this->manager, 'sanctum')
                         ->getJson('/api/inventory');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_create_inventory_item(): void
    {
        $category = Category::factory()->create();

        $payload = [
            'name' => 'Raw Sugar',
            'category_id' => $category->id,
            'quantity' => 100,
            'price' => 0,
            'cost' => 50,
            'barcode' => 'SUGAR001',
        ];

        $response = $this->actingAs($this->manager, 'sanctum')
                         ->postJson('/api/inventory', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('menu_items', ['barcode' => 'SUGAR001']);
        $this->assertDatabaseHas('stock_transactions', ['type' => 'restock']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_get_stock_alerts(): void
    {
        $category = Category::factory()->create(['type' => 'drink']);
        MenuItem::factory()->create([
            'category_id' => $category->id, 
            'quantity' => 2,
            'branch_id' => $this->manager->branch_id
        ]); // Low stock
        MenuItem::factory()->create([
            'category_id' => $category->id, 
            'quantity' => 20,
            'branch_id' => $this->manager->branch_id
        ]); // Normal stock

        $response = $this->actingAs($this->manager, 'sanctum')
                         ->getJson('/api/inventory/alerts');

        $response->assertStatus(200)
                 ->assertJsonPath('count', 1);
    }
}
