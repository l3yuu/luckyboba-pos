<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint; // Added this import
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change (Table $table) to (Blueprint $table)
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('value'); // e.g., "20%" or "100.00"
            $table->enum('status', ['Active', 'Redeemed', 'Inactive'])->default('Active');
            $table->string('type'); // Percentage, Fixed Amount, etc.
            $table->string('receipt')->default('N/A');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};