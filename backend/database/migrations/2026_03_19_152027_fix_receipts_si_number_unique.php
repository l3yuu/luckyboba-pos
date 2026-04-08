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
    Schema::table('receipts', function (Blueprint $table) {
        $table->dropUnique('receipts_si_number_unique');
        $table->unique(['si_number', 'branch_id'], 'receipts_si_number_branch_unique');
    });
}

public function down(): void
{
    Schema::table('receipts', function (Blueprint $table) {
        $table->dropUnique('receipts_si_number_branch_unique');
        $table->unique('si_number', 'receipts_si_number_unique');
    });
}
};
