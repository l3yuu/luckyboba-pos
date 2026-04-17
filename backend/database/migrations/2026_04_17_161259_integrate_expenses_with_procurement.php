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
            $table->foreignId('supplier_id')->nullable()->after('branch_id')->constrained('suppliers')->onDelete('set null');
            $table->foreignId('purchase_order_id')->nullable()->after('supplier_id')->constrained('purchase_orders')->onDelete('set null');
            $table->string('payment_status')->default('Paid')->after('amount'); // Paid, Pending, Partial
            $table->string('payment_method')->nullable()->after('payment_status'); // Cash, GCash, Bank Transfer, Petty Cash
            $table->date('due_date')->nullable()->after('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropForeign(['purchase_order_id']);
            $table->dropColumn(['supplier_id', 'purchase_order_id', 'payment_status', 'payment_method', 'due_date']);
        });
    }
};
