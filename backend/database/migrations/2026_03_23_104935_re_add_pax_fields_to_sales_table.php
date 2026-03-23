<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'pax_senior'))
                $table->unsignedInteger('pax_senior')->nullable()->after('customer_name');

            if (!Schema::hasColumn('sales', 'pax_pwd'))
                $table->unsignedInteger('pax_pwd')->nullable()->after('pax_senior');

            if (!Schema::hasColumn('sales', 'senior_id'))
                $table->string('senior_id')->nullable()->after('pax_pwd');

            if (!Schema::hasColumn('sales', 'pwd_id'))
                $table->string('pwd_id')->nullable()->after('senior_id');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['pax_senior', 'pax_pwd', 'senior_id', 'pwd_id']);
        });
    }
};  // ← semicolon here!