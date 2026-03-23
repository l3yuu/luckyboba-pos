<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('sc_discount_amount',       10, 2)->default(0)->after('discount_amount');
            $table->decimal('pwd_discount_amount',      10, 2)->default(0)->after('sc_discount_amount');
            $table->decimal('diplomat_discount_amount', 10, 2)->default(0)->after('pwd_discount_amount');
            $table->decimal('other_discount_amount',    10, 2)->default(0)->after('diplomat_discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'sc_discount_amount',
                'pwd_discount_amount',
                'diplomat_discount_amount',
                'other_discount_amount',
            ]);
        });
    }
};