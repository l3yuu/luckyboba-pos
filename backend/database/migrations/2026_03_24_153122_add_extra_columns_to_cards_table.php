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
    Schema::table('cards', function (Blueprint $table) {
        if (!Schema::hasColumn('cards', 'sort_order')) {
            $table->integer('sort_order')->default(0)->after('is_active');
        }
        if (!Schema::hasColumn('cards', 'available_months')) {
            $table->string('available_months')->nullable()->after('sort_order');
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            //
        });
    }
};
