<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Make order_id nullable since order is created after payment success
            $table->unsignedBigInteger('order_id')->nullable()->change();

            // Store pre-order info
            $table->string('order_type', 20)->nullable()->after('status');
            $table->text('notes')->nullable()->after('order_type');
            $table->dateTime('pickup_time')->nullable()->after('notes');
            $table->json('cart_snapshot')->nullable()->after('pickup_time');

            // Add user_id to link payment to a specific customer
            if (!Schema::hasColumn('payments', 'user_id')) {
                $table->unsignedBigInteger('user_id')->after('id')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['order_type', 'notes', 'pickup_time', 'cart_snapshot', 'user_id']);
        });
    }
};
