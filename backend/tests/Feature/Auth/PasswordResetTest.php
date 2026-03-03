<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
// ADD THIS
use Illuminate\Foundation\Testing\WithoutMiddleware; 
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;
    use WithoutMiddleware; // This stops the 419 "Session Expired" error

    public function test_reset_password_link_can_be_requested(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->post('/forgot-password', ['email' => $user->email]);

        // In an API setup, check for success status instead of redirect
        $response->assertStatus(200); 
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        // 1. Request the link
        $this->post('/forgot-password', ['email' => $user->email]);

        // 2. Intercept the token from the "sent" notification
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $response = $this->post('/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]);

            // For Sanctum/Breeze API, it usually returns a status 200 with a JSON message
            $response->assertStatus(200);
            
            return true;
        });
    }
}