<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create the Admin Account (Bina Admin)
        User::create([
            'name' => 'Bina Admin',
            'email' => 'admin@luckyboba.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'ACTIVE',
            'branch_name' => 'Main Branch',
            'email_verified_at' => now(), // Matches the date shown in your image
        ]);

        // 2. Create the Cashier Account (Matching your screenshot exactly)
        User::create([
            'name' => 'Cashier Ichigo',
            'email' => 'cashier@luckyboba.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier', 
            'status' => 'ACTIVE', // Capitalized to match your image
            'branch_name' => null, // NULL as shown in your image
            'email_verified_at' => now(),
        ]);
    }
}