<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

public function test_users_can_authenticate_using_the_login_screen(): void
{
    $user = User::factory()->create();

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertOk()
             ->assertJsonStructure([
                 'token',
                 'user' => ['id', 'email']
             ]);

    // Verify a token was actually created for this user
    $this->assertCount(1, $user->tokens);
}
    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

public function test_users_can_logout(): void
{
    $user = User::factory()->create();
    
    // Explicitly create a token for the user so currentAccessToken() isn't null
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/logout');

    $response->assertStatus(200)
             ->assertJson(['message' => 'Logged out successfully']);
    
    $this->assertCount(0, $user->tokens);
}
}