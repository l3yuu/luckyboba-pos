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
        if (!Schema::hasColumn('cash_transactions', 'shift')) {
            Schema::table('cash_transactions', function (Blueprint $table) {
                $table->integer('shift')->default(1)->after('branch_id');
            });
        }

        if (!Schema::hasColumn('cash_counts', 'shift')) {
            Schema::table('cash_counts', function (Blueprint $table) {
                $table->integer('shift')->default(1)->after('branch_id');
            });
        }

        if (!Schema::hasColumn('sales', 'shift')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->integer('shift')->default(1)->after('branch_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('cash_transactions', 'shift')) {
            Schema::table('cash_transactions', function (Blueprint $table) {
                $table->dropColumn('shift');
            });
        }

        if (Schema::hasColumn('cash_counts', 'shift')) {
            Schema::table('cash_counts', function (Blueprint $table) {
                $table->dropColumn('shift');
            });
        }

        if (Schema::hasColumn('sales', 'shift')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('shift');
            });
        }
    }
};
