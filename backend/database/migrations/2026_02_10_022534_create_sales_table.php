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
            $table->foreignId('user_id')->constrained(); 
            
            $table->decimal('total_amount', 10, 2);
            $table->string('invoice_number')->unique(); // Added: Needed for OR tracking
            $table->string('status')->default('completed'); // Added: completed, cancelled, void
            
            $table->string('payment_method')->default('cash');
            $table->string('charge_type')->nullable(); 
            $table->integer('pax')->default(1);
            $table->boolean('is_synced')->default(false);
            $table->timestamps();

            $table->index('created_at', 'idx_sales_created_at'); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};