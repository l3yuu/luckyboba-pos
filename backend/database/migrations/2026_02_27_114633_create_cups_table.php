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
    Schema::create('cups', function (Blueprint $table) {
        $table->id();
        $table->string('name');        // e.g. "SM/SL Cup"
        $table->string('size_m');      // e.g. "SM"
        $table->string('size_l');      // e.g. "SL"
        $table->string('code');        // e.g. "SM/SL"
        $table->timestamps();
    });

    // Add cup_id foreign key to categories
    Schema::table('categories', function (Blueprint $table) {
        $table->foreignId('cup_id')->nullable()->constrained('cups')->nullOnDelete()->after('type');
    });
}

public function down(): void
{
    Schema::table('categories', function (Blueprint $table) {
        $table->dropForeign(['cup_id']);
        $table->dropColumn('cup_id');
    });
    Schema::dropIfExists('cups');
}
};
