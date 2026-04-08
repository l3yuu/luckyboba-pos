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
    Schema::table('add_ons', function (Blueprint $table) {
        if (!Schema::hasColumn('add_ons', 'grab_price')) {
            $table->decimal('grab_price',  8, 2)->default(0)->after('price');
        }
        if (!Schema::hasColumn('add_ons', 'panda_price')) {
            $table->decimal('panda_price', 8, 2)->default(0)->after('grab_price');
        }
    });
}

public function down(): void
{
    Schema::table('add_ons', function (Blueprint $table) {
        if (Schema::hasColumn('add_ons', 'grab_price')) {
            $table->dropColumn('grab_price');
        }
        if (Schema::hasColumn('add_ons', 'panda_price')) {
            $table->dropColumn('panda_price');
        }
    });
}
};
