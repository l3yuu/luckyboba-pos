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
            $table->string('title')->after('id');
            $table->unsignedBigInteger('branch_id')->nullable()->after('category');
            $table->text('notes')->nullable()->after('branch_id');
            $table->string('receipt_path')->nullable()->after('notes');
            $table->string('recorded_by')->nullable()->after('receipt_path');
            
            // Make ref_num nullable since we use title now
            $table->string('ref_num')->nullable()->change();
            
            // Re-index branch_id for performance
            $table->index('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['title', 'branch_id', 'notes', 'receipt_path', 'recorded_by']);
            $table->string('ref_num')->nullable(false)->change();
        });
    }
};
