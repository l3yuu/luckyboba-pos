<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('user_id');
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });

        // Backfill existing rows from their user's branch
        DB::statement('
            UPDATE cash_transactions ct
            JOIN users u ON ct.user_id = u.id
            SET ct.branch_id = u.branch_id
            WHERE ct.user_id IS NOT NULL
            AND u.branch_id IS NOT NULL
        ');
    }

    public function down(): void
    {
        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};