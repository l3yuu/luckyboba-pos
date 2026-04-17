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
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->decimal('unit_cost', 12, 4)->default(0)->after('last_purchase_price')->comment('Cost per base unit');
        });

        // Initialize from existing data
        DB::statement("UPDATE raw_materials SET unit_cost = last_purchase_price / purchase_to_base_factor WHERE purchase_to_base_factor > 0 AND last_purchase_price > 0");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->dropColumn('unit_cost');
        });
    }
};
