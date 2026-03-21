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

        if ($driver === 'sqlite') {
            // SQLite does not support MODIFY COLUMN.
            // Strategy: add a new string column, copy data, drop the old one,
            // then rename — but SQLite also doesn't support DROP COLUMN before
            // version 3.35, so we use the table-rebuild approach via Blueprint.
            Schema::table('bundles', function (Blueprint $table) {
                $table->string('bundle_type_new')->default('bundle')->after('bundle_type');
            });

            DB::statement('UPDATE bundles SET bundle_type_new = bundle_type');

            Schema::table('bundles', function (Blueprint $table) {
                $table->dropColumn('bundle_type');
            });

            Schema::table('bundles', function (Blueprint $table) {
                $table->renameColumn('bundle_type_new', 'bundle_type');
            });
        } else {
            // MySQL / MariaDB — MODIFY COLUMN with ENUM works fine.
            DB::statement("
                ALTER TABLE bundles
                MODIFY COLUMN bundle_type
                ENUM('bundle', 'combo', 'mix_and_match')
                NOT NULL DEFAULT 'bundle'
            ");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('bundles', function (Blueprint $table) {
                $table->string('bundle_type_old')->default('bundle')->after('bundle_type');
            });

            // Clamp any mix_and_match values back to bundle on rollback
            DB::statement("UPDATE bundles SET bundle_type_old = CASE WHEN bundle_type = 'mix_and_match' THEN 'bundle' ELSE bundle_type END");

            Schema::table('bundles', function (Blueprint $table) {
                $table->dropColumn('bundle_type');
            });

            Schema::table('bundles', function (Blueprint $table) {
                $table->renameColumn('bundle_type_old', 'bundle_type');
            });
        } else {
            DB::statement("
                ALTER TABLE bundles
                MODIFY COLUMN bundle_type
                ENUM('bundle', 'combo')
                NOT NULL DEFAULT 'bundle'
            ");
        }
    }
};