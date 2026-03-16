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
    Schema::table('categories', function (Blueprint $table) {
        $table->integer('sort_order')->default(0)->after('description');
        $table->boolean('is_active')->default(true)->after('sort_order');
    });
}

public function down(): void
{
    Schema::table('categories', function (Blueprint $table) {
        $table->dropColumn(['sort_order', 'is_active']);
    });
}
};
