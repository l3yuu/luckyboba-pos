<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function can_get_all_users()
    {
        // ✅ Authenticate a user (VERY IMPORTANT)
        Sanctum::actingAs(
            User::factory()->create()
        );

        // ✅ Create users that the API should return
        User::factory()->count(3)->create();

        // ✅ Call the protected API route
        $response = $this->getJson('/api/users');

        // ✅ Assert response
        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }
}
