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
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('dispatched_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropForeign(['created_by_id']);
            $table->dropForeign(['approved_by_id']);
            $table->dropForeign(['dispatched_by_id']);
            $table->dropForeign(['received_by_id']);
            $table->dropColumn(['created_by_id', 'approved_by_id', 'dispatched_by_id', 'received_by_id']);
        });
    }
};
