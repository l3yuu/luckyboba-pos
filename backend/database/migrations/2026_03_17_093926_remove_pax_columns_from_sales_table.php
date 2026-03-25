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
    Schema::table('sales', function (Blueprint $table) {
        $table->dropColumn([
            'pax',
            'pax_regular',
            'pax_senior',
            'pax_pwd',
            'pax_diplomat',
            'senior_id',
            'pwd_id',
            'diplomat_id',
        ]);
    });
}

public function down(): void
{
    Schema::table('sales', function (Blueprint $table) {
        $table->integer('pax')->default(1);
        $table->integer('pax_regular')->default(1);
        $table->integer('pax_senior')->default(0);
        $table->integer('pax_pwd')->default(0);
        $table->integer('pax_diplomat')->default(0);
        $table->string('senior_id')->nullable();
        $table->string('pwd_id')->nullable();
        $table->string('diplomat_id')->nullable();
    });
}
};
