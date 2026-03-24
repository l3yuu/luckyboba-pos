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
        Schema::table('sales', function (Blueprint $table) {
            $table->integer('pax_senior')->default(0)->after('cash_tendered');
            $table->integer('pax_pwd')->default(0)->after('pax_senior');
            $table->string('senior_id')->nullable()->after('pax_pwd');
            $table->string('pwd_id')->nullable()->after('senior_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['pax_senior', 'pax_pwd', 'senior_id', 'pwd_id']);
        });
    }
};
