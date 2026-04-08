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
    Schema::table('sub_categories', function (Blueprint $table) {
        $table->integer('sort_order')->default(0)->after('is_active');
    });
}

public function down(): void
{
    Schema::table('sub_categories', function (Blueprint $table) {
        $table->dropColumn('sort_order');
    });
}
};
