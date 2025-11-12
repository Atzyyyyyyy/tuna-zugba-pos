<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'email_verified' => false,
            'phone_verified' => false,
            'agreed_terms' => true,
            'otp' => Str::random(6),
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function verified(): static
    {
        return $this->state(fn () => [
            'email_verified' => true,
        ]);
    }
}
