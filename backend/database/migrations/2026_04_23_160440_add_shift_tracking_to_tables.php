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
        Schema::table('users', function (Blueprint $table) {
            $table->string('current_shift')->nullable()->after('status');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('shift')->nullable()->after('branch_id');
        });

        Schema::table('cash_counts', function (Blueprint $table) {
            $table->string('shift')->nullable()->after('branch_id');
        });

        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->string('shift')->nullable()->after('branch_id');
        });

        Schema::table('z_readings', function (Blueprint $table) {
            $table->string('shift')->nullable()->after('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('current_shift');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('shift');
        });

        Schema::table('cash_counts', function (Blueprint $table) {
            $table->dropColumn('shift');
        });

        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->dropColumn('shift');
        });

        Schema::table('z_readings', function (Blueprint $table) {
            $table->dropColumn('shift');
        });
    }
};
