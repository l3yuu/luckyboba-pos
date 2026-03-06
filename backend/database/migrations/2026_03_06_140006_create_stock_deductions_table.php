<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_deductions', function (Blueprint $table) {
            $table->id();

            // Which sale triggered this deduction
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();

            // Which line item in that sale
            $table->unsignedBigInteger('sale_item_id');
            $table->index('sale_item_id');

            // Which raw material was deducted
            $table->foreignId('raw_material_id')->constrained()->cascadeOnDelete();

            // Which recipe line caused this deduction (for audit trail)
            $table->foreignId('recipe_item_id')->constrained()->cascadeOnDelete();

            $table->decimal('quantity_deducted', 10, 4);
            $table->timestamps();

            // Fast lookups: by sale, by material, by date range
            $table->index(['sale_id', 'raw_material_id'], 'idx_deductions_sale_material');
            $table->index('raw_material_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_deductions');
    }
};