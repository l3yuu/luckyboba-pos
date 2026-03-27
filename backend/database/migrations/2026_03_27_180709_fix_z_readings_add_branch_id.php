<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('z_readings', function (Blueprint $table) {

            // Step 1: Drop the old single-column unique index
            $table->dropUnique('z_readings_reading_date_unique');

            // Step 2: Add missing net_sales column
            $table->decimal('net_sales', 12, 2)
                  ->nullable()
                  ->after('total_sales');

            // Step 3: New composite unique index per branch per day
            $table->unique(
                ['reading_date', 'branch_id'],
                'z_readings_date_branch_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('z_readings', function (Blueprint $table) {
            $table->dropUnique('z_readings_date_branch_unique');
            $table->dropColumn('net_sales');
            $table->unique('reading_date', 'z_readings_reading_date_unique');
        });
    }
};