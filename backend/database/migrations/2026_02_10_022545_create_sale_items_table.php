<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    if (!Schema::hasTable('sale_items')) {
        return;
    }

    Schema::table('sale_items', function (Blueprint $table) {
        if (!Schema::hasColumn('sale_items', 'size')) {
            $table->string('size')->nullable()->after('final_price');
        }
        if (!Schema::hasColumn('sale_items', 'sugar_level')) {
            $table->string('sugar_level')->nullable()->after('size');
        }
        if (!Schema::hasColumn('sale_items', 'options')) {
            $table->json('options')->nullable()->after('sugar_level');
        }
        if (!Schema::hasColumn('sale_items', 'add_ons')) {
            $table->json('add_ons')->nullable()->after('options');
        }
    });
}
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};