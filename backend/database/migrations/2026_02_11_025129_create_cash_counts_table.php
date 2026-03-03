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
        Schema::create('cash_counts', function (Blueprint $table) {
            $table->id();
            $table->string('terminal_id')->default('01');
            $table->decimal('total_amount', 15, 2);
            $table->json('breakdown'); // Stores the counts for each denomination
            $table->text('remarks')->nullable();
            $table->foreignId('user_id')->constrained(); // Tracks which cashier did the count
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_counts');
    }
};
