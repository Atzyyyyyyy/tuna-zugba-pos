<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_register()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '09171234567',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'agreed_terms' => true,
        ]);

        $response->assertStatus(201)
                 ->assertJson(['success' => true]);
    }

    /** @test */
    public function user_cannot_login_without_verification()
    {
        $user = User::factory()->create([
            'email_verified' => false,
            'phone_verified' => false,
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
                 ->assertJson(['success' => false]);
    }

    /** @test */
    public function verified_user_can_login()
    {
        $user = User::factory()->create([
            'email_verified' => true,
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['access_token', 'user']);
    }

    /** @test */
    public function forgot_password_sends_link()
    {
        $user = User::factory()->create([
            'email' => 'forgot@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }

    /** @test */
    public function reset_password_updates_password()
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => Hash::make('oldpassword'),
        ]);

        DB::table('password_reset_tokens')->insert([
    'email' => $user->email,
    'token' => Hash::make('dummy-token'),
    'created_at' => now(),
    
]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'dummy-token',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200)
         ->assertJson(['success' => true]);
         $this->assertTrue(
        Hash::check('newpassword123', $user->fresh()->password),
        'The password should have been updated.'
    );
    }
}
