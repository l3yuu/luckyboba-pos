<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE bundles MODIFY COLUMN bundle_type ENUM('bundle', 'combo', 'mix_and_match') NOT NULL DEFAULT 'bundle'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE bundles MODIFY COLUMN bundle_type ENUM('bundle', 'combo') NOT NULL DEFAULT 'bundle'");
    }
};