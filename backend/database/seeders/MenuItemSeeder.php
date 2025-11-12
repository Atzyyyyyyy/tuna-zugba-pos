<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'name' => 'Grilled Tuna',
                'category' => 'seafood',
                'description' => 'Fresh grilled tuna belly',
                'price' => 150.00,
                'stock' => 10,
                'is_new' => true,
                'image_url' => 'tuna.jpg',
                'sales_count' => 50
            ],
            [
                'name' => 'Pork Sisig',
                'category' => 'pork',
                'description' => 'Sizzling pork with onions',
                'price' => 120.00,
                'stock' => 15,
                'is_new' => false,
                'image_url' => 'sisig.jpg',
                'sales_count' => 30
            ],
            [
                'name' => 'Chicken Inasal',
                'category' => 'chicken',
                'description' => 'Grilled chicken with spices',
                'price' => 100.00,
                'stock' => 20,
                'is_new' => true,
                'image_url' => 'inasal.jpg',
                'sales_count' => 40
            ],
            [
                'name' => 'Bangus Belly',
                'category' => 'seafood',
                'description' => 'Grilled milkfish belly',
                'price' => 130.00,
                'stock' => 12,
                'is_new' => false,
                'image_url' => 'bangus.jpg',
                'sales_count' => 20
            ],
            [
                'name' => 'Kinilaw',
                'category' => 'appetizer',
                'description' => 'Raw fish in vinegar',
                'price' => 90.00,
                'stock' => 8,
                'is_new' => false,
                'image_url' => 'kinilaw.jpg',
                'sales_count' => 10
            ],
        ];

        MenuItem::upsert($items, ['name'], [
            'category', 'description', 'price', 'stock', 'is_new', 'image_url', 'sales_count'
        ]);
    }
}

