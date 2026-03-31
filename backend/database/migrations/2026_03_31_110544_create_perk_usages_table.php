<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perk_usages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('card_id');
            $table->string('perk_name', 100);
            $table->date('used_date')->default(DB::raw('(CURDATE())'));
            $table->string('order_id', 100)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'perk_name', 'used_date'], 'unique_perk_per_day');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('card_id')->references('id')->on('cards')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perk_usages');
    }
};