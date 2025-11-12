<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('promos');

        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->nullable(); // Promo code like "WEEKEND50"
            $table->string('description')->nullable();

            // 💸 Discount system
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->decimal('discount_value', 8, 2)->default(0);

            // 💰 Conditions
            $table->decimal('min_order_total', 8, 2)->nullable(); // e.g., min ₱500 order
            $table->enum('day_condition', ['All', 'Weekday', 'Weekend', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
                ->default('All');
            $table->enum('condition_type', ['none', 'first_time', 'order_count', 'time_range'])->default('none');
            $table->string('condition_value')->nullable(); // e.g., "18:00-21:00" or "5"
            
            $table->boolean('is_active')->default(true);

            // 🕓 Time limits
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promos');
    }
};
