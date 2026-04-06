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
        $table->boolean('is_closed')->default(false)->after('data');
        $table->timestamp('closed_at')->nullable()->after('is_closed');
    });
}

    public function down()
    {
        Schema::table('z_readings', function (Blueprint $table) {
            $table->dropColumn(['is_closed', 'closed_at']);
        });
    }
};
