<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase; // Import this!
use Tests\TestCase;
use App\Models\User;

class UserApiTest extends TestCase
{
    use RefreshDatabase; // Use this to create the tables automatically

// tests/Feature/UserApiTest.php

public function test_can_get_all_users(): void
{
    // 1. Arrange: Create a user so the count is 1
    User::factory()->create();

    // 2. Act: Call the API (MUST include /api)
    $response = $this->getJson('/api/users');

    // 3. Assert
    $response->assertStatus(200)
             ->assertJsonCount(1);
}
}