<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Policy;

class PolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            [
                'title' => 'Privacy Policy',
                'type' => 'privacy',
                'content' => 'This Privacy Policy explains how Tuna Zugba collects, uses, and protects your personal data in compliance with data privacy laws. We ensure that all customer information remains confidential and secure.',
            ],
            [
                'title' => 'Terms and Conditions',
                'type' => 'terms',
                'content' => 'These Terms and Conditions govern your use of the Tuna Zugba POS and Online Ordering System. By accessing or using this system, you agree to be bound by these terms and all applicable regulations.',
            ],
            [
                'title' => 'Refund Policy',
                'type' => 'refund',
                'content' => 'Our Refund Policy outlines the process for order issues or cancellations. Customers may request refunds for incorrect or damaged orders, subject to admin review within 3–5 business days.',
            ],
        ];

        foreach ($policies as $policy) {
            Policy::updateOrCreate(
                ['type' => $policy['type']],
                ['title' => $policy['title'], 'content' => $policy['content']]
            );
        }
    }
}
