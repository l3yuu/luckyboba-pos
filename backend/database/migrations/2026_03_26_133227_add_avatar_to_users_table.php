<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Adds the 'avatar' column right after the 'email' column.
            // It's nullable because users won't have an avatar when they first sign up.
            $table->string('avatar')->nullable()->after('email');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Drops the column if we ever need to rollback the database
            $table->dropColumn('avatar');
        });
    }
};