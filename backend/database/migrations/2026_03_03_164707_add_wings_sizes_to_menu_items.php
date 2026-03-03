<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE menu_items MODIFY COLUMN size ENUM('M', 'L', 'none', '3pc', '4pc', '6pc', '12pc') NOT NULL DEFAULT 'none'");
        } else {
            // SQLite doesn't support MODIFY COLUMN — skip (tests only)
            // SQLite has no ENUM type so the column already accepts any string
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE menu_items MODIFY COLUMN size ENUM('M', 'L', 'none') NOT NULL DEFAULT 'none'");
        }
    }
};