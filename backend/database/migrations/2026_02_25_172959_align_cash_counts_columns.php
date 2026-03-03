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
    Schema::table('cash_counts', function (Blueprint $table) {
        $table->renameColumn('total_amount', 'actual_amount');
        $table->decimal('expected_amount', 15, 2)->after('terminal_id')->default(0);
        $table->decimal('short_over', 15, 2)->after('actual_amount')->default(0);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
