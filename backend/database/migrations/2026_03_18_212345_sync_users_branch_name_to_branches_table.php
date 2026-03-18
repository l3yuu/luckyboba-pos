<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Fix any existing stale branch_name values
        DB::statement('
            UPDATE users u
            JOIN branches b ON u.branch_id = b.id
            SET u.branch_name = b.name
            WHERE u.branch_name != b.name
               OR u.branch_name IS NULL
        ');

        // Step 2: Add foreign key — but check indexes first
        Schema::table('users', function (Blueprint $table) {

            // Only drop the plain index if it actually exists
            $hasIndex = DB::select("
                SELECT INDEX_NAME
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME   = 'users'
                  AND INDEX_NAME   = 'users_branch_id_index'
            ");

            if (!empty($hasIndex)) {
                $table->dropIndex('users_branch_id_index');
            }

            // Only add the foreign key if it doesn't already exist
            $hasForeign = DB::select("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA    = DATABASE()
                  AND TABLE_NAME      = 'users'
                  AND CONSTRAINT_NAME = 'users_branch_id_foreign'
            ");

            if (empty($hasForeign)) {
                $table->foreign('branch_id')
                      ->references('id')
                      ->on('branches')
                      ->onUpdate('cascade')
                      ->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $hasForeign = DB::select("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA    = DATABASE()
                  AND TABLE_NAME      = 'users'
                  AND CONSTRAINT_NAME = 'users_branch_id_foreign'
            ");

            if (!empty($hasForeign)) {
                $table->dropForeign(['branch_id']);
            }
        });
    }
};