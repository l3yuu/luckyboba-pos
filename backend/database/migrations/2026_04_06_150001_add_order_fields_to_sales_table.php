<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('subtotal', 10, 2)->default(0)->after('total_amount');
            $table->string('order_type')->default('dine_in')->after('payment_method'); // dine_in, take_out, online
            $table->string('cashier_name')->nullable()->after('order_type');
            $table->string('customer_name')->nullable()->after('user_id');
            $table->decimal('vatable_sales', 10, 2)->default(0)->after('subtotal');
            $table->decimal('vat_amount', 10, 2)->default(0)->after('vatable_sales');
            $table->decimal('cash_tendered', 10, 2)->default(0)->after('total_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal',
                'order_type',
                'cashier_name',
                'customer_name',
                'vatable_sales',
                'vat_amount',
                'cash_tendered'
            ]);
        });
    }
};
