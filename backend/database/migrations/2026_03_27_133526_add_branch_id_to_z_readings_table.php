<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('z_readings', function (Blueprint $table) {
        $table->unsignedBigInteger('branch_id')->nullable()->after('id');
        $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
    });
}

public function down()
{
    Schema::table('z_readings', function (Blueprint $table) {
        $table->dropForeign(['branch_id']);
        $table->dropColumn('branch_id');
    });
}
};
