<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('sale_items', function (Blueprint $table) {
        $table->string('size')->nullable()->after('final_price');
        $table->string('sugar_level')->nullable()->after('size');
        $table->json('options')->nullable()->after('sugar_level');
        $table->json('add_ons')->nullable()->after('options');
    });
}

public function down(): void
{
    Schema::table('sale_items', function (Blueprint $table) {
        $table->dropColumn(['size', 'sugar_level', 'options', 'add_ons']);
    });
}
};
