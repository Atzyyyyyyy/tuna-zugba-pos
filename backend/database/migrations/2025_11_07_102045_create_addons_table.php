<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('addons', function (Blueprint $table) {
    $table->id();
    $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
    $table->string('name');          // e.g., "Extra Egg"
    $table->decimal('price', 8, 2);  // e.g., 15.00
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addons');
    }
};
