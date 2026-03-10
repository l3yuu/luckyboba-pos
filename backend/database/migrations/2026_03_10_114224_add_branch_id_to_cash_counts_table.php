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
            $table->unsignedBigInteger('branch_id')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('cash_counts', function (Blueprint $table) {
            $table->dropColumn('branch_id');
        });
    }
};
