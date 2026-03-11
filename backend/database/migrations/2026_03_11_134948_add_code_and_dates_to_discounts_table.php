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
        Schema::table('discounts', function (Blueprint $table) {
            $table->string('code')->nullable()->unique()->after('name');
            $table->date('starts_at')->nullable()->after('used_count');
            $table->date('ends_at')->nullable()->after('starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('discounts', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn(['code', 'starts_at', 'ends_at']);
        });
    }
};
