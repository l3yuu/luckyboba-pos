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
    Schema::table('categories', function (Blueprint $table) {
        // 'drink' | 'food' | 'wings' | 'bundle' | 'combo' | 'promo'
        $table->string('category_type')->default('food')->after('name');
    });

    Schema::table('bundles', function (Blueprint $table) {
        // which category this bundle belongs to (superadmin assigns this)
        $table->foreignId('category_id')
              ->nullable()
              ->constrained('categories')
              ->nullOnDelete()
              ->after('id');

        // 'bundle' = all drinks (FP Coffee, GF Duo)
        // 'combo'  = food + drink (Combo Meals, Pizza Pedricos Combo)
        $table->enum('bundle_type', ['bundle', 'combo'])->default('bundle')->after('category_id');
    });
}
};
