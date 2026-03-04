<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->integer('pax_regular')->default(1);
            $table->integer('pax_senior')->default(0);
            $table->integer('pax_pwd')->default(0);
            $table->integer('pax_diplomat')->default(0);
            
            $table->string('senior_id')->nullable();
            $table->string('pwd_id')->nullable();
            $table->string('diplomat_id')->nullable();
            
            $table->string('discount_remarks')->nullable();
            
            $table->decimal('vatable_sales', 10, 2)->default(0);
            $table->decimal('vat_amount', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'pax_regular', 'pax_senior', 'pax_pwd', 'pax_diplomat',
                'senior_id', 'pwd_id', 'diplomat_id',
                'discount_remarks', 'vatable_sales', 'vat_amount'
            ]);
        });
    }
};