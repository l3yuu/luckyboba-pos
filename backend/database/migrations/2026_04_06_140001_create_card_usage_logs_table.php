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
        if (!Schema::hasTable('card_usage_logs')) {
            Schema::create('card_usage_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('card_id');
                $table->string('promo_type');
                $table->date('used_date');
                $table->timestamps();

                $table->index(['user_id', 'card_id', 'used_date']);
                $table->index(['user_id', 'promo_type', 'used_date']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_usage_logs');
    }
};
