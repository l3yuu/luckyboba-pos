<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('branches', function (Blueprint $table) {
        if (!Schema::hasColumn('branches', 'owner_name')) {
            $table->string('owner_name')->nullable()->after('serial_number'); // ← fixed
        }
    });
}

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (Schema::hasColumn('branches', 'owner_name')) {
                $table->dropColumn('owner_name');
            }
        });
    }
};