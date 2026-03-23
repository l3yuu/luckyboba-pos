<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->enum('vat_type', ['vat', 'non_vat'])
                  ->default('vat')
                  ->after('ownership_type')
                  ->comment('Only meaningful for franchise branches');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('vat_type');
        });
    }
};