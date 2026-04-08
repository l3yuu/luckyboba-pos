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
            // Add branch_id if missing
            if (!Schema::hasColumn('expenses', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->onDelete('cascade');
            }

            // Add recorded_by if missing
            if (!Schema::hasColumn('expenses', 'recorded_by')) {
                $table->foreignId('recorded_by')->nullable()->after('branch_id')->constrained('users')->onDelete('set null');
            }
            
            // Rename description to title (Defensive)
            if (Schema::hasColumn('expenses', 'description') && !Schema::hasColumn('expenses', 'title')) {
                $table->renameColumn('description', 'title');
            }
            
            // Add notes column if missing
            if (!Schema::hasColumn('expenses', 'notes')) {
                $table->text('notes')->nullable()->after('category');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }
            if (Schema::hasColumn('expenses', 'recorded_by')) {
                $table->dropForeign(['recorded_by']);
                $table->dropColumn('recorded_by');
            }
            if (Schema::hasColumn('expenses', 'title') && !Schema::hasColumn('expenses', 'description')) {
                $table->renameColumn('title', 'description');
            }
            if (Schema::hasColumn('expenses', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
