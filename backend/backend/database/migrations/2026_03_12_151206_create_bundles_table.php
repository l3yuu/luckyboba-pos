<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bundles', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // e.g. "SWEETY", "2 CL PEARL M.TEA"
            $table->string('display_name')->nullable();    // optional marketing name shown on POS
            $table->string('category');                    // e.g. "GF DUO BUNDLES", "FP COFFEE BUNDLES"
            $table->string('barcode')->unique();           // e.g. "GF1", "COF1"
            $table->decimal('price', 10, 2);               // bundle price (discounted vs sum of items)
            $table->string('size')->default('L');          // cup size (L, M, none)
            $table->foreignId('cup_id')
                  ->nullable()
                  ->constrained('cups')
                  ->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundles');
    }
};