<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_verify_email()
    {
        $user = User::factory()->create([
            'email_verified' => false,
            'email_verification_token' => Str::random(40),
        ]);

        $response = $this->getJson('/api/verify-email?token=' . $user->email_verification_token);

        $response->assertStatus(302); // redirected to frontend success page
        $this->assertTrue($user->fresh()->email_verified);
        $this->assertNull($user->fresh()->email_verification_token);
    }

    /** @test */
    public function user_cannot_verify_with_invalid_token()
    {
        $response = $this->getJson('/api/verify-email?token=invalid-token');

        $response->assertStatus(404)
                 ->assertJson(['success' => false]);
    }

    /** @test */
    public function user_can_verify_phone_with_correct_otp()
    {
        $user = User::factory()->create([
            'phone' => '09171234567',
            'otp' => '123456',
            'phone_verified' => false,
        ]);

        $response = $this->postJson('/api/verify-phone', [
            'phone' => '09171234567',
            'otp' => '123456',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertTrue($user->fresh()->phone_verified);
        $this->assertNull($user->fresh()->otp);
    }

    /** @test */
    public function user_cannot_verify_phone_with_wrong_otp()
    {
        $user = User::factory()->create([
            'phone' => '09999999999',
            'otp' => '654321',
            'phone_verified' => false,
        ]);

        $response = $this->postJson('/api/verify-phone', [
            'phone' => '09999999999',
            'otp' => '111111',
        ]);

        $response->assertStatus(401)
                 ->assertJson(['success' => false]);
    }
}
