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
            $table->decimal('price', 10, 2); 
            $table->decimal('final_price', 10, 2); 
            
            // Drink Specific Customizations
            $table->string('sugar_level')->nullable();
            $table->string('size')->nullable();
            
            $table->json('options')->nullable(); 
            $table->json('add_ons')->nullable();
            
            $table->timestamps();

            // --- CUSTOM INDEXES FOR SPEED ---
            // We provide specific names to prevent SQLite/MySQL name collisions
            $table->index(['created_at', 'product_name'], 'idx_items_created_product');
            $table->index(['product_name', 'created_at', 'quantity'], 'idx_items_analytic_lookup');
            $table->index(['product_name', 'quantity'], 'idx_items_inventory_qty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};