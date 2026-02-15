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
            // foreignId automatically creates an index for user_id, 
            // so we don't need to add it manually below.
            $table->foreignId('user_id')->constrained(); 
            
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_method')->default('cash');
            $table->string('charge_type')->nullable(); 
            $table->integer('pax')->default(1);
            $table->boolean('is_synced')->default(false);
            $table->timestamps();

            // Using a specific name 'idx_sales_created_at' prevents the collision error 
            // during 'php artisan test'
            $table->index('created_at', 'idx_sales_created_at'); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};