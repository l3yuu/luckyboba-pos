<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();

            // Links to menu_items — using unsignedBigInteger to match
            // your sale_items pattern (no FK constraint, menu_items can be deleted freely)
            $table->unsignedBigInteger('menu_item_id');
            $table->index('menu_item_id');

            // Size must match sale_items.size exactly: 'M', 'L', or null
            // null means this recipe applies to all sizes (e.g. hot drinks, add-ons)
            $table->string('size')->nullable();

            $table->string('name')->nullable(); // e.g. "Classic Pearl MT - Medium"
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // One recipe per menu item per size
            $table->unique(['menu_item_id', 'size'], 'unique_recipe_item_size');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};