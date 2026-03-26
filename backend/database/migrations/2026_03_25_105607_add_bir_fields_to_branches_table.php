<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'brand')) {
                $table->string('brand')->nullable()->default('Lucky Boba Milk Tea')->after('vat_type');
            }
            if (!Schema::hasColumn('branches', 'company_name')) {
                $table->string('company_name')->nullable()->after('brand');
            }
            if (!Schema::hasColumn('branches', 'store_address')) {
                $table->string('store_address')->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('branches', 'vat_reg_tin')) {
                $table->string('vat_reg_tin')->nullable()->after('store_address');
            }
            if (!Schema::hasColumn('branches', 'min_number')) {
                $table->string('min_number')->nullable()->after('vat_reg_tin');
            }
            if (!Schema::hasColumn('branches', 'serial_number')) {
                $table->string('serial_number')->nullable()->after('min_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $columns = [
                'brand',
                'company_name',
                'store_address',
                'vat_reg_tin',
                'min_number',
                'serial_number',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('branches', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};