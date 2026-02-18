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
        Schema::create('sub_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            
            /** * FOREIGN KEY: category_id
             * This connects the sub-category to your Main Categories.
             * 'onDelete(cascade)' means if a Main Category is deleted, 
             * its Sub Categories are also removed automatically.
             */
            $table->foreignId('category_id')
                  ->constrained('categories') 
                  ->onDelete('cascade');
                  
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_categories');
    }
};