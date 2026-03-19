<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        // Step 1: Fix any existing stale branch_name values (SQLite-compatible subquery)
        DB::statement("
            UPDATE users
            SET branch_name = (
                SELECT branches.name
                FROM branches
                WHERE branches.id = users.branch_id
            )
            WHERE branch_id IS NOT NULL
              AND (
                branch_name IS NULL
                OR branch_name != (
                    SELECT branches.name
                    FROM branches
                    WHERE branches.id = users.branch_id
                )
              )
        ");

        // Step 2: Add foreign key — SQLite handles FK differently
        if ($driver === 'sqlite') {
            // SQLite: foreign keys are defined at table creation and can't be
            // added after the fact via ALTER TABLE, so we skip index/FK checks.
            // FK constraints are enforced at the app/Eloquent level instead.
            return;
        }

        // MySQL / other drivers: check indexes and add FK normally
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
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

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