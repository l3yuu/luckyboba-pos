<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_method')->default('cash');
            // Added to match your frontend 'orderChargeType' (grab/panda/null)
            $table->string('charge_type')->nullable(); 
            $table->integer('pax')->default(1);
            // Track which admin/staff made the sale
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('is_synced')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};