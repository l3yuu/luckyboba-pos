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
            // Add missing receipt_path column
            if (!Schema::hasColumn('expenses', 'receipt_path')) {
                $table->string('receipt_path')->nullable()->after('notes');
            }
            
            // Make ref_num nullable (since title is now used)
            $table->string('ref_num')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'receipt_path')) {
                $table->dropColumn('receipt_path');
            }
            $table->string('ref_num')->nullable(false)->change();
        });
    }
};
