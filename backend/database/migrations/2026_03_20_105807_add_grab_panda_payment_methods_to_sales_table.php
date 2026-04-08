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
        if (!Schema::hasColumn('sales', 'charge_type')) {
            $table->string('charge_type')->nullable()->after('payment_method');
        }
    });
}

public function down(): void
{
    Schema::table('sales', function (Blueprint $table) {
        if (Schema::hasColumn('sales', 'charge_type')) {
            $table->dropColumn('charge_type');
        }
    });
}
};
