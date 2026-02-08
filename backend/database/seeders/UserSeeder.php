<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create an Admin/Manager Account
        User::create([
            'name' => 'Bina Admin',
            'email' => 'admin@luckyboba.com',
            'password' => Hash::make('password123'),
            'role' => 'admin', // Matching your HeidiSQL column
            'status' => 'active',
            'branch_name' => 'Main Branch',
        ]);

        // Create a Staff Account
        User::create([
            'name' => 'Lucky Staff',
            'email' => 'staff@luckyboba.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
            'status' => 'active',
            'branch_name' => 'Main Branch',
        ]);
    }
}