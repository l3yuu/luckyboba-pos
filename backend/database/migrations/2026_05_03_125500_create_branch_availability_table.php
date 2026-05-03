<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_availability', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id');
            $table->string('entity_type', 30); // menu_item, category, sub_category, add_on, bundle
            $table->unsignedBigInteger('entity_id');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->unique(['branch_id', 'entity_type', 'entity_id'], 'branch_entity_unique');
            $table->index(['branch_id', 'entity_type']);
        });

        // Migrate existing data from branch_menu_availability to the new table
        $existing = DB::table('branch_menu_availability')->get();
        foreach ($existing as $row) {
            DB::table('branch_availability')->insert([
                'branch_id'    => $row->branch_id,
                'entity_type'  => 'menu_item',
                'entity_id'    => $row->menu_item_id,
                'is_available' => $row->is_available,
                'created_at'   => $row->created_at,
                'updated_at'   => $row->updated_at,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_availability');
    }
};
