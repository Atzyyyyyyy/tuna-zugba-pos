<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PolicyFactory extends Factory
{
    public function definition(): array
    {
        static $usedTypes = [];

        $types = ['privacy', 'terms', 'refund'];
        $available = array_diff($types, $usedTypes);
        $type = $available ? array_shift($available) : $this->faker->unique()->word();

        $usedTypes[] = $type;

        return [
            'type' => $type,
            'title' => ucfirst($this->faker->word()) . ' Policy',
            'content' => $this->faker->paragraph(5),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
