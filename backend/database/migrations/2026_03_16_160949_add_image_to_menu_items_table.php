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
        Schema::table('menu_items', function (Blueprint $table) {
            // ✅ Adds the 'image' column after the 'name' column. 
            // It is nullable so your 292 existing items don't break!
            $table->string('image')->nullable()->after('name'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // ✅ Removes the column if you ever undo this migration
            $table->dropColumn('image');
        });
    }
};