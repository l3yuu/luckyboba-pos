<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->unsignedBigInteger('menu_item_id')->nullable()->after('sale_id');
        });

        // Match existing sale_items to menu_items by product_name
        DB::statement('
            UPDATE sale_items si
            JOIN menu_items mi ON mi.name = si.product_name
            SET si.menu_item_id = mi.id
        ');
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('menu_item_id');
        });
    }
};