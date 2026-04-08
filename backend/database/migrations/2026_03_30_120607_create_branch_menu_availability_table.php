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
    Schema::create('branch_menu_availability', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('branch_id');
        $table->unsignedBigInteger('menu_item_id');
        $table->boolean('is_available')->default(true);
        $table->timestamps();

        $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
        $table->foreign('menu_item_id')->references('id')->on('menu_items')->onDelete('cascade');
        $table->unique(['branch_id', 'menu_item_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('branch_menu_availability');
}
};
