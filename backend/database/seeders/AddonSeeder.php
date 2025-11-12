<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Addon;

class AddonSeeder extends Seeder
{
    public function run(): void
    {
        Addon::insert([
            ['menu_item_id' => 1, 'name' => 'Extra Egg', 'price' => 15.00],
            ['menu_item_id' => 1, 'name' => 'Extra Rice', 'price' => 20.00],
            ['menu_item_id' => 3, 'name' => 'Switch to Pork', 'price' => 10.00],
            ['menu_item_id' => 3, 'name' => 'Add Chicken', 'price' => 12.00],
        ]);
    }
}

