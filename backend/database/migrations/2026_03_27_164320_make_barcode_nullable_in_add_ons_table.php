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
    Schema::table('add_ons', function (Blueprint $table) {
        $table->string('barcode')->nullable()->default(null)->change();
    });
}

public function down(): void
{
    Schema::table('add_ons', function (Blueprint $table) {
        $table->string('barcode')->nullable(false)->change();
    });
}
};
