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
        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->integer('shift')->default(1)->after('branch_id');
        });

        Schema::table('cash_counts', function (Blueprint $table) {
            $table->integer('shift')->default(1)->after('branch_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->integer('shift')->default(1)->after('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->dropColumn('shift');
        });

        Schema::table('cash_counts', function (Blueprint $table) {
            $table->dropColumn('shift');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('shift');
        });
    }
};
