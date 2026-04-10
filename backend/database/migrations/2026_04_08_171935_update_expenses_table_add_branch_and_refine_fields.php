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
        Schema::table('expenses', function (Blueprint $table) {
            // Add new columns
            $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('recorded_by')->nullable()->after('branch_id')->constrained('users')->onDelete('set null');
            
            // Rename description to title
            $table->renameColumn('description', 'title');
            
            // Add notes column
            $table->text('notes')->nullable()->after('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
            $table->dropForeign(['recorded_by']);
            $table->dropColumn('recorded_by');
            
            $table->renameColumn('title', 'description');
            
            $table->dropColumn('notes');
        });
    }
};
