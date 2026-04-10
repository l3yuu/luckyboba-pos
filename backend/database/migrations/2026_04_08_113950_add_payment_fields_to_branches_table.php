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
        Schema::table('branches', function (Blueprint $table) {
            $table->string('gcash_name')->nullable()->after('status');
            $table->string('gcash_number')->nullable()->after('gcash_name');
            $table->string('gcash_qr')->nullable()->after('gcash_number');
            $table->string('maya_name')->nullable()->after('gcash_qr');
            $table->string('maya_number')->nullable()->after('maya_name');
            $table->string('maya_qr')->nullable()->after('maya_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'gcash_name', 'gcash_number', 'gcash_qr',
                'maya_name', 'maya_number', 'maya_qr'
            ]);
        });
    }
};
