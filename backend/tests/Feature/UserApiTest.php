<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase; // ensures a clean DB for every test

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_get_all_users(): void
    {
        // Arrange — create exactly 3 users
        User::factory()->count(3)->create();

        // Act
        $response = $this->getJson('/api/users');

        // Assert
        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }
}