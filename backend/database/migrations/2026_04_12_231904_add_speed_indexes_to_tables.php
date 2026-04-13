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
        Schema::table('users', function (Blueprint $table) {
            $table->index('branch_id');
            $table->index('role');
            $table->index('status');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index('type');
        });
        
        // Optimize sales aggregate reporting explicitly
        Schema::table('sales', function (Blueprint $table) {
            // Check if exist, but drop normally if making composite mapping easier.
            // Usually we just add it. MySQL understands redundant index usage nicely.
            $table->index(['status', 'branch_id', 'created_at'], 'idx_sales_reporting_composite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['type']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_reporting_composite');
        });
    }
};
