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
        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('type'); // cash_in, cash_drop, etc.
            $table->decimal('amount', 12, 2);
            $table->text('note')->nullable(); // Based on your screenshot
            $table->boolean('is_synced')->default(false);
            $table->timestamps();
            $table->index(['created_at', 'type'], 'idx_cash_stats');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
