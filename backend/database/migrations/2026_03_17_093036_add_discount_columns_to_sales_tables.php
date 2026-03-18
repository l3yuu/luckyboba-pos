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
        // ── Add discount columns to sales table ───────────────────────────────
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_id')
                  ->nullable()
                  ->after('vat_amount')
                  ->comment('FK to discounts table (order-level promo/voucher)');

            $table->decimal('discount_amount', 10, 2)
                  ->default(0.00)
                  ->after('discount_id')
                  ->comment('Total order-level discount applied (promo/voucher)');

            $table->foreign('discount_id')
                  ->references('id')
                  ->on('discounts')
                  ->nullOnDelete();
        });

        // ── Add discount columns to sale_items table ──────────────────────────
        Schema::table('sale_items', function (Blueprint $table) {
            $table->unsignedBigInteger('discount_id')
                  ->nullable()
                  ->after('surcharge')
                  ->comment('FK to discounts table (item-level discount e.g. Senior/PWD)');

            $table->string('discount_label')
                  ->nullable()
                  ->after('discount_id')
                  ->comment('Human-readable discount label e.g. "Senior/PWD (20%)"');

            $table->string('discount_type')
                  ->nullable()
                  ->after('discount_label')
                  ->comment('none | percent | fixed');

            $table->decimal('discount_value', 10, 2)
                  ->nullable()
                  ->after('discount_type')
                  ->comment('The raw discount value (e.g. 20 for 20%, or 50 for ₱50 off)');

            $table->decimal('discount_amount', 10, 2)
                  ->default(0.00)
                  ->after('discount_value')
                  ->comment('Computed discount amount in pesos for this line item');

            $table->foreign('discount_id')
                  ->references('id')
                  ->on('discounts')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['discount_id']);
            $table->dropColumn([
                'discount_id',
                'discount_label',
                'discount_type',
                'discount_value',
                'discount_amount',
            ]);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['discount_id']);
            $table->dropColumn(['discount_id', 'discount_amount']);
        });
    }
};