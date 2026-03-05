<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix menu_items missing columns
        Schema::table('menu_items', function (Blueprint $table) {
            if (!Schema::hasColumn('menu_items', 'type')) {
                $table->enum('type', ['food', 'drink'])->default('food')->after('cost');
            }
            if (!Schema::hasColumn('menu_items', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('type');
            }
            if (!Schema::hasColumn('menu_items', 'sub_category_id')) {
                $table->unsignedBigInteger('sub_category_id')->nullable()->after('category_id');
            }
        });

        // Fix categories missing column
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'menu_items_count')) {
                $table->unsignedInteger('menu_items_count')->default(0)->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['type', 'status', 'sub_category_id']);
        });
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('menu_items_count');
        });
    }
};