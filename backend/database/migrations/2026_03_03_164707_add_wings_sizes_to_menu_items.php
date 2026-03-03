<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE menu_items MODIFY COLUMN size ENUM('M', 'L', 'none', '3pc', '4pc', '6pc', '12pc') NOT NULL DEFAULT 'none'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE menu_items MODIFY COLUMN size ENUM('M', 'L', 'none') NOT NULL DEFAULT 'none'");
    }
};