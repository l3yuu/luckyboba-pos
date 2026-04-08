<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('total_amount');
            }
            if (!Schema::hasColumn('sales', 'order_type')) {
                $table->string('order_type')->default('dine_in')->after('payment_method');
            }
            if (!Schema::hasColumn('sales', 'cashier_name')) {
                $table->string('cashier_name')->nullable()->after('order_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal',
                'order_type',
                'cashier_name',
            ]);
        });
    }
};
