<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function can_get_all_users(): void
    {
        // Arrange — create an admin to authenticate as
        /** @var User $admin */
        $admin = User::factory()->create([
            'role'   => 'superadmin',
            'status' => 'ACTIVE',
        ]);

        // Create 3 additional users
        User::factory()->count(3)->create();

        // Act — authenticate with Sanctum before hitting the route
        $response = $this->actingAs($admin, 'sanctum')
                         ->getJson('/api/users');

        // Assert — response is 200 and data array has 4 users (admin + 3)
        $response->assertStatus(200)
                 ->assertJsonCount(4, 'data');
    }
}