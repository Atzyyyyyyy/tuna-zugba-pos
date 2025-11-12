<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'order_type')) {
                $table->enum('order_type', ['dine-in', 'take-out', 'pickup'])->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('orders', 'pickup_time')) {
                $table->timestamp('pickup_time')->nullable()->after('order_type');
            }
            if (!Schema::hasColumn('orders', 'notes')) {
                $table->string('notes')->nullable()->after('pickup_time');
            }
            if (!Schema::hasColumn('orders', 'total_amount')) {
                $table->decimal('total_amount', 10, 2)->default(0)->after('notes');
            }
        });
    }

    public function down(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['order_type', 'pickup_time', 'notes', 'total_amount']);
        });
    }
};


