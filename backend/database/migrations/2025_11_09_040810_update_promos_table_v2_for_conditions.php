<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            // 💡 Existing columns already handle base logic
            // Now we add advanced condition support
            $table->string('condition_type')->nullable()->after('day_condition'); 
            // Examples: "first_time", "order_count", "time_range"

            $table->string('condition_value')->nullable()->after('condition_type');
            // e.g. "5" for every 5th order, or "18:00-21:00" for happy hour
        });
    }

    public function down(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            $table->dropColumn(['condition_type', 'condition_value']);
        });
    }
};
