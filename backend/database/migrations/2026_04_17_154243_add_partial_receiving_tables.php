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
        // Add quantity_received to PO items
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->decimal('quantity_received', 12, 2)->default(0)->after('quantity');
        });

        // Change PO status to string to easily handle 'Partially Received' 
        // and any future statuses without enum headaches.
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('status')->default('Draft')->change();
        });

        // Create PO Receipts table
        Schema::create('purchase_order_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('received_by_id')->constrained('users')->cascadeOnDelete();
            $table->string('reference_number')->nullable()->comment('Supplier Inv/DR #');
            $table->text('notes')->nullable();
            $table->decimal('total_amount_received', 12, 2)->default(0);
            $table->timestamp('received_at')->useCurrent();
            $table->timestamps();
        });

        // Create PO Receipt Items table
        Schema::create('purchase_order_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_receipt_id', 'po_receipt_id_foreign')->constrained('purchase_order_receipts')->cascadeOnDelete();
            $table->foreignId('purchase_order_item_id', 'po_item_id_foreign')->constrained('purchase_order_items')->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->decimal('quantity_received', 12, 2);
            $table->decimal('unit_cost', 12, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_receipt_items');
        Schema::dropIfExists('purchase_order_receipts');

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->enum('status', ['Draft', 'Approved', 'Received', 'Cancelled'])->default('Draft')->change();
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn('quantity_received');
        });
    }
};
