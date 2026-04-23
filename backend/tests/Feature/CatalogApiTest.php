<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create([
            'role' => 'superadmin',
            'status' => 'ACTIVE',
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_list_categories(): void
    {
        Category::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->getJson('/api/categories');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_create_category(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson('/api/categories', [
                             'name' => 'New Category',
                             'type' => 'drink',
                             'category_type' => 'drink',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('name', 'New Category');
        
        $this->assertDatabaseHas('categories', ['name' => 'New Category']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_update_category(): void
    {
        $category = Category::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/categories/{$category->id}", [
                             'name' => 'Updated Name',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('name', 'Updated Name');
        
        $this->assertDatabaseHas('categories', ['name' => 'Updated Name']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_delete_category_without_items(): void
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function cannot_delete_category_with_items(): void
    {
        $category = Category::factory()->create();
        MenuItem::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
