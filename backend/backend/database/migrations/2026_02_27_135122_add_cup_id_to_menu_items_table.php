<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->unsignedBigInteger('cup_id')->nullable()->after('sub_category_id');

            $table->foreign('cup_id')
                  ->references('id')
                  ->on('cups')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropForeign(['cup_id']);
            $table->dropColumn('cup_id');
        });
    }
};