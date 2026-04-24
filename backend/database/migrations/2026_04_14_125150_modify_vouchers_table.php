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
        Schema::table('vouchers', function (Blueprint $table) {
            // Keep existing columns: code, value, status, type, receipt
            $table->string('description')->nullable()->after('code');
            $table->decimal('min_spend', 10, 2)->default(0)->after('value');
            $table->decimal('max_discount', 10, 2)->nullable()->after('min_spend');
            $table->timestamp('expiry_date')->nullable()->after('status');
            $table->integer('usage_limit')->nullable()->after('expiry_date')->comment('NULL means unlimited');
            $table->integer('times_used')->default(0)->after('usage_limit');
            $table->boolean('is_active')->default(true)->after('times_used');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'min_spend',
                'max_discount',
                'expiry_date',
                'usage_limit',
                'times_used',
                'is_active'
            ]);
        });
    }
};
