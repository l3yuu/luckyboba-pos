<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('unit');              // PC, PK, BAG, BTL, BX, ML, G
            $table->string('category');          // Packaging, Ingredients, Intermediate
            $table->decimal('current_stock', 10, 4)->default(0);
            $table->decimal('reorder_level', 10, 4)->default(0);
            $table->boolean('is_intermediate')->default(false); // cooked/mixed items (e.g. MILK TEA COOKED)
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_materials');
    }
};