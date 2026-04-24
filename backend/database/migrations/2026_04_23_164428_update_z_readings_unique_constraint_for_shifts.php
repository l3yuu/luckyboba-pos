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
        Schema::table('z_readings', function (Blueprint $table) {
            // Drop the old composite unique index that didn't account for shifts
            $table->dropUnique('z_readings_date_branch_unique');

            // Add new composite unique index including shift
            $table->unique(['reading_date', 'branch_id', 'shift'], 'z_readings_date_branch_shift_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('z_readings', function (Blueprint $table) {
            $table->dropUnique('z_readings_date_branch_shift_unique');
            $table->unique(['reading_date', 'branch_id'], 'z_readings_date_branch_unique');
        });
    }
};
