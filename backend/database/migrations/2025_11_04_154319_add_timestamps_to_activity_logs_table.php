<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            // Add timestamps if missing
            if (!Schema::hasColumn('activity_logs', 'created_at') && 
                !Schema::hasColumn('activity_logs', 'updated_at')) {
                $table->timestamps(); // adds created_at and updated_at
            }
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            if (Schema::hasColumn('activity_logs', 'created_at')) {
                $table->dropTimestamps(); // removes both columns
            }
        });
    }
};
