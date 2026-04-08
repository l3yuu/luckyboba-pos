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
        Schema::table('sales', function (Blueprint $table) {
            $table->index('branch_id');
            $table->index('status');
            $table->index('is_synced');
            $table->index(['branch_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['is_synced']);
            $table->dropIndex(['branch_id', 'created_at']);
        });
    }
};
