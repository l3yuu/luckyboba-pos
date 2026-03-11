<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('sales', function (Blueprint $table) {
        if (!Schema::hasColumn('sales', 'user_id')) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        }
        if (!Schema::hasColumn('sales', 'charge_type')) {
            $table->string('charge_type')->nullable()->after('payment_method');
        }
        if (!Schema::hasColumn('sales', 'pax')) {
            $table->integer('pax')->default(1)->after('charge_type');
        }
        if (!Schema::hasColumn('sales', 'cancellation_reason')) {
            $table->string('cancellation_reason')->nullable()->after('status');
        }
        if (!Schema::hasColumn('sales', 'cancelled_at')) {
            $table->timestamp('cancelled_at')->nullable()->after('cancellation_reason');
        }
    });
}

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('final_price');
        });
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['status', 'invoice_number']);
        });
    }
};