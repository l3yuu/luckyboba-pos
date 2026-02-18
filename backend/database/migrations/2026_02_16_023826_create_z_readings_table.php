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
        Schema::create('z_readings', function (Blueprint $table) {
            $table->id();
            $table->date('reading_date')->unique(); // One z-reading per day
            $table->decimal('total_sales', 12, 2);
            $table->json('data'); // Stores the full breakdown
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('z_readings');
    }
};
