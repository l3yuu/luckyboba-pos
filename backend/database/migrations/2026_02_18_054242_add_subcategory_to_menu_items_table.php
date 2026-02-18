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
    Schema::table('menu_items', function (Blueprint $table) {
        // We make it nullable so existing items don't break
        $table->foreignId('sub_category_id')->nullable()->constrained('sub_categories')->onDelete('set null');
    });
}

public function down(): void
{
    Schema::table('menu_items', function (Blueprint $table) {
        $table->dropForeign(['sub_category_id']);
        $table->dropColumn('sub_category_id');
    });
}
};
