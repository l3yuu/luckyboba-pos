<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Setting;
use App\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_login_successfully(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'status' => 'ACTIVE',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'user', 'token']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function returns_401_for_invalid_login(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_get_public_menu(): void
    {
        // Arrange
        $category = Category::factory()->create(['name' => 'Boba', 'category_type' => 'drink']);
        MenuItem::factory()->count(5)->create([
            'category_id' => $category->id,
            'status' => 'active'
        ]);

        // Act
        $response = $this->getJson('/api/public-menu');

        // Assert
        $response->assertStatus(200)
                 ->assertJsonCount(5);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_verify_global_kiosk_pin(): void
    {
        Setting::create(['key' => 'global_kiosk_pin', 'value' => '9999']);

        $response = $this->postJson('/api/kiosk/verify-pin', [
            'pin' => '9999'
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_verify_branch_kiosk_pin(): void
    {
        $branch = Branch::factory()->create(['kiosk_pin' => '8888']);

        $response = $this->postJson('/api/kiosk/verify-pin', [
            'pin' => '8888',
            'branch_id' => $branch->id
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }
}
