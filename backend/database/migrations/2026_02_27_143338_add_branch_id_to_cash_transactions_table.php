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

    // ✅ SQLite-compatible backfill using subquery instead of JOIN
    DB::statement('
        UPDATE cash_transactions
        SET branch_id = (
            SELECT users.branch_id
            FROM users
            WHERE users.id = cash_transactions.user_id
            AND users.branch_id IS NOT NULL
        )
        WHERE user_id IS NOT NULL
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