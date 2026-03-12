<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bundle_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')
                  ->constrained('bundles')
                  ->cascadeOnDelete();

            // FK to your existing menu_items — nullable because some bundle
            // components (e.g. "DARK ROAST COFFEE" in FP COFFEE BUNDLES)
            // may not exist as standalone menu items
            $table->foreignId('menu_item_id')
                  ->nullable()
                  ->constrained('menu_items')
                  ->nullOnDelete();

            // Fallback label when no menu_item_id is linked
            $table->string('custom_name')->nullable();

            $table->integer('quantity')->default(1);
            $table->string('size')->default('L');         // individual item size within bundle
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundle_items');
    }
};