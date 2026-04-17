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
            $table->timestamp('approved_at')->nullable()->after('approved_by_id');
            $table->timestamp('dispatched_at')->nullable()->after('dispatched_by_id');
            $table->timestamp('received_at')->nullable()->after('received_by_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropColumn(['approved_at', 'dispatched_at', 'received_at']);
        });
    }
};
