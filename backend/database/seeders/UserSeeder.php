<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'name' => 'Admin User',
                'email' => 'admin@tunazugba.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified' => true,
                'agreed_terms' => true,
            ],
            [
                'name' => 'Staff User',
                'email' => 'staff@tunazugba.com',
                'password' => Hash::make('staff123'),
                'role' => 'staff',
                'email_verified' => true,
                'agreed_terms' => true,
            ],
            [
                'name' => 'Sample Customer',
                'email' => 'customer@tunazugba.com',
                'password' => Hash::make('customer123'),
                'role' => 'customer',
                'email_verified' => true,
                'agreed_terms' => true,
            ],
        ]);
    }
}
