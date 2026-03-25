<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sugar_levels', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('value');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('sugar_levels')->insert([
            ['label' => '0% (No Sugar)',  'value' => '0%',   'sort_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => '25% Less Sugar', 'value' => '25%',  'sort_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => '50% Less Sugar', 'value' => '50%',  'sort_order' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => '75% Less Sugar', 'value' => '75%',  'sort_order' => 4, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['label' => '100% (Regular)', 'value' => '100%', 'sort_order' => 5, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sugar_levels');
    }
};