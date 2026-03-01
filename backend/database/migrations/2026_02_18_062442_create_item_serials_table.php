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
        Schema::create('item_serials', function (Blueprint $table) {
            $table->id();
            $table->string('item_name');
            $table->string('serial_number')->unique();
            $table->enum('status', ['In Stock', 'Sold', 'Defective'])->default('In Stock');
            $table->date('date_added');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_serials');
    }
};
