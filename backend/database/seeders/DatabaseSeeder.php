<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // This tells Laravel: "Go run the UserSeeder file"
        $this->call([
            UserSeeder::class,
            // Later you will add CategorySeeder::class here!
        ]);
    }
}