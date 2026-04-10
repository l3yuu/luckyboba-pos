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
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('point_cost');
            $table->string('category')->default('drink'); // drink, food, topper, etc.
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable(); // for future flexibility (e.g. multi-branch limits)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};
