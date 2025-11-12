<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            $table->decimal('min_order_total', 8, 2)->nullable()->after('discount_value'); // ✅ Minimum total to apply
            $table->string('day_condition')->nullable()->after('min_order_total'); // ✅ e.g., "Saturday", "Weekend", or "All"
            $table->boolean('is_active')->default(true)->after('day_condition'); // ✅ Toggle
        });
    }

    public function down(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            $table->dropColumn(['min_order_total', 'day_condition', 'is_active']);
        });
    }
};
