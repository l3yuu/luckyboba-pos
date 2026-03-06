<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained()->cascadeOnDelete();

            // How much of this raw material is used per 1 serving
            $table->decimal('quantity', 10, 4);
            $table->string('unit'); // must match raw_materials.unit

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['recipe_id', 'raw_material_id'], 'idx_recipe_items_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_items');
    }
};