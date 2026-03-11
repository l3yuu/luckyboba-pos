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
        $table->decimal('surcharge', 10, 2)->default(0)->after('final_price');
        $table->string('charge_type')->nullable()->after('surcharge'); // 'grab' | 'panda' | null
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            //
        });
    }
};
