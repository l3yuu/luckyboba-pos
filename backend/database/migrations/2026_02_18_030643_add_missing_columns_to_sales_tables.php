<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sale_items', 'final_price')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->decimal('final_price', 10, 2)->default(0)->after('price');
            });
        }

        if (!Schema::hasColumn('sales', 'status')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->string('status')->default('completed')->after('total_amount');
            });
        }

        if (!Schema::hasColumn('sales', 'invoice_number')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->string('invoice_number')->nullable()->after('id');
            });
        }
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