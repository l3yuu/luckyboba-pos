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
            $table->string('purchase_unit')->nullable()->after('unit');
            $table->decimal('purchase_to_base_factor', 12, 4)->default(1.0000)->after('purchase_unit');
            $table->decimal('last_purchase_price', 12, 2)->default(0.00)->after('purchase_to_base_factor');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->string('ordered_unit')->nullable()->after('raw_material_id');
            $table->decimal('conversion_factor', 12, 4)->default(1.0000)->after('ordered_unit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->dropColumn(['purchase_unit', 'purchase_to_base_factor', 'last_purchase_price']);
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn(['ordered_unit', 'conversion_factor']);
        });
    }
};
