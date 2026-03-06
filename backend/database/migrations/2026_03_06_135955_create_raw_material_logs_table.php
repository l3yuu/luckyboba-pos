<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_material_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raw_material_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('shift')->default('full'); // am, pm, full

            // Daily movement columns — mirrors your Excel exactly
            $table->decimal('beginning', 10, 4)->default(0);
            $table->decimal('delivery', 10, 4)->default(0);
            $table->decimal('stock_in', 10, 4)->default(0);
            $table->decimal('stock_out', 10, 4)->default(0);
            $table->decimal('spoilage', 10, 4)->default(0);

            // Ending: actual = physically counted, expected = computed from sales
            $table->decimal('ending_actual', 10, 4)->default(0);
            $table->decimal('ending_expected', 10, 4)->default(0);
            $table->decimal('variance', 10, 4)->default(0); // actual - expected

            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One log per material per day per shift
            $table->unique(['raw_material_id', 'date', 'shift'], 'unique_material_date_shift');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_material_logs');
    }
};