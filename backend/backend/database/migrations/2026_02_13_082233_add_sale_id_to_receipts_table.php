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
        // Add the sale_id column as a foreign key
        $table->foreignId('sale_id')->nullable()->constrained()->onDelete('cascade')->after('total_amount');
    });
}

public function down(): void
{
    Schema::table('receipts', function (Blueprint $table) {
        $table->dropForeign(['sale_id']);
        $table->dropColumn('sale_id');
    });
}
};
