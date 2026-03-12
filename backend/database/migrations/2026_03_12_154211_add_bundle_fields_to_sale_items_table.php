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
            $table->foreignId('bundle_id')->nullable()->constrained('bundles')->nullOnDelete()->after('menu_item_id');
            $table->json('bundle_components')->nullable()->after('bundle_id');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['bundle_id']);
            $table->dropColumn(['bundle_id', 'bundle_components']);
        });
    }
};
