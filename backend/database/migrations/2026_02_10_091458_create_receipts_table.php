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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('si_number')->unique(); // SI #
            $table->string('terminal');            // TRML #
            $table->integer('items_count');        // Items
            $table->string('cashier_name');        // Cashier
            $table->decimal('total_amount', 15, 2); // Total Sales (stored as decimal for precision)
            $table->timestamps();                  // This creates created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
