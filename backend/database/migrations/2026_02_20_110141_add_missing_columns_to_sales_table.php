<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('sales', function (Blueprint $table) {
        $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        $table->string('charge_type')->nullable()->after('payment_method');
        $table->integer('pax')->default(1)->after('charge_type');
        $table->string('cancellation_reason')->nullable()->after('status');
        $table->timestamp('cancelled_at')->nullable()->after('cancellation_reason');
    });
}

public function down(): void
{
    Schema::table('sales', function (Blueprint $table) {
        $table->dropForeign(['user_id']);
        $table->dropColumn(['user_id', 'charge_type', 'pax', 'cancellation_reason', 'cancelled_at']);
    });
}
};
