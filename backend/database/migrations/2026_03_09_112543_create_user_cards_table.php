<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('user_cards', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('user_id');
        $table->unsignedBigInteger('card_id')->nullable(); // no foreign key constraint
        $table->date('last_b1g1_used_date')->nullable(); 
        $table->timestamp('expires_at')->nullable();
        $table->string('status')->default('active');
        $table->string('payment_method');
        $table->string('transaction_id')->nullable(); 
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_cards');
    }
};