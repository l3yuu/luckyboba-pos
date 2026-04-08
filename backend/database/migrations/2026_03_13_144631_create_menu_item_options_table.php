<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->enum('option_type', ['pearl', 'ice', 'sugar']);
            $table->timestamps();

            $table->unique(['menu_item_id', 'option_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_options');
    }
};