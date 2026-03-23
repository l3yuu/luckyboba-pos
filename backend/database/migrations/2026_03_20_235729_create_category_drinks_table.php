<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_drinks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')
                  ->constrained('categories')
                  ->onDelete('cascade');
            $table->foreignId('menu_item_id')
                  ->constrained('menu_items')
                  ->onDelete('cascade');
            $table->string('size', 10)->default('M');
            $table->timestamps();

            $table->unique(['category_id', 'menu_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_drinks');
    }
};