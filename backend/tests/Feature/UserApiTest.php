<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase; // Import this!
use Tests\TestCase;
use App\Models\User;

class UserApiTest extends TestCase
{
    use RefreshDatabase; // Use this to create the tables automatically

    public function test_can_get_all_users()
    {
        // 1. Create a fake user in the memory database so there is something to "Get"
        User::factory()->create([
            'name' => 'Test User',
            'role' => 'admin',
        ]);

        // 2. Act
        $response = $this->getJson('/api/users');

        // 3. Assert
        $response->assertStatus(200)
                 ->assertJsonCount(1); // Check if 1 user was returned
    }
}