<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First delete all existing records since they reference menu_items instead of raw_materials
        DB::table('purchase_order_items')->delete();
        DB::table('purchase_orders')->delete();

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn('supplier');
            
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->date('expected_date')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropForeign(['menu_item_id']);
            $table->dropColumn('menu_item_id');
            
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropForeign(['raw_material_id']);
            $table->dropColumn('raw_material_id');
            
            $table->foreignId('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropForeign(['created_by_id']);
            $table->dropForeign(['approved_by_id']);
            $table->dropForeign(['received_by_id']);
            
            $table->dropColumn([
                'supplier_id',
                'expected_date',
                'notes',
                'created_by_id',
                'approved_by_id',
                'received_by_id'
            ]);
            
            $table->string('supplier')->nullable();
        });
    }
};
