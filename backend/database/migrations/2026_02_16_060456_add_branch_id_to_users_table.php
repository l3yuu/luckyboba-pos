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
            // Add branch_id column after role column
            $table->unsignedBigInteger('branch_id')->nullable()->after('role');
            
            // Add index for better query performance
            $table->index('branch_id');
            
            // Add foreign key constraint
            $table->foreign('branch_id')
                  ->references('id')
                  ->on('branches')
                  ->onDelete('set null'); // If branch is deleted, set user's branch_id to NULL
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['branch_id']);
            
            // Drop index
            $table->dropIndex(['branch_id']);
            
            // Drop column
            $table->dropColumn('branch_id');
        });
    }
};