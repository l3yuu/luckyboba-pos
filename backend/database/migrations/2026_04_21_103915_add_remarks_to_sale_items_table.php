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
        Schema::table('sale_items', function (Blueprint $table) {
            $table->text('remarks')->nullable()->after('add_ons');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function up_down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('remarks');
        });
    }
};
