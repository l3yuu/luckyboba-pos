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