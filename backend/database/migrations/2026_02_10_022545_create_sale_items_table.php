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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            // Link to the main sale
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            
            // Item identification
            $table->unsignedBigInteger('menu_item_id'); 
            $table->string('product_name');
            
            // Quantity and Pricing
            $table->integer('quantity');
            $table->decimal('price', 10, 2); // Unit price
            $table->decimal('final_price', 10, 2); // Price x Qty + extras
            
            // Drink Specific Customizations
            $table->string('sugar_level')->nullable();
            $table->string('size')->nullable();
            
            // Use JSON for arrays like ['NO ICE', 'WARM'] or ['Pearl', 'Nata']
            $table->json('options')->nullable(); 
            $table->json('add_ons')->nullable();
            
            $table->timestamps();

            // --- CUSTOM INDEXES FOR SPEED ---
            
            // 1. Dashboard Speed: Date first, then product name
            $table->index(['created_at', 'product_name'], 'idx_created_product');

            // 2. Advanced Analytics: Product first, then date and qty
            $table->index(['product_name', 'created_at', 'quantity'], 'idx_product_created_qty');

            // 3. Inventory/Simple Lookups: Product name and quantity
            $table->index(['product_name', 'quantity'], 'idx_product_qty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};