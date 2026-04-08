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
    Schema::table('branches', function (Blueprint $table) {
        $table->string('brand')->nullable()->default('Lucky Boba Milk Tea')->after('vat_type');
        $table->string('company_name')->nullable()->after('brand');
        $table->string('store_address')->nullable()->after('company_name');
        $table->string('vat_reg_tin')->nullable()->after('store_address');
        $table->string('min_number')->nullable()->after('vat_reg_tin');
        $table->string('serial_number')->nullable()->after('min_number');
    });
}

public function down(): void
{
    Schema::table('branches', function (Blueprint $table) {
        $table->dropColumn([
            'brand', 'company_name', 'store_address',
            'vat_reg_tin', 'min_number', 'serial_number',
        ]);
    });
}
};
