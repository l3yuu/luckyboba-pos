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
    Schema::create('add_ons', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->decimal('price', 8, 2);
        $table->string('barcode')->unique();
        $table->boolean('is_available')->default(true);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('add_ons');
}
};
