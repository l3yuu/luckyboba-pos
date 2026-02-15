<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or update Admin
        User::updateOrCreate(
            ['email' => 'admin@luckyboba.com'], // Find by email
            [
                'name' => 'Bina Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'ACTIVE',
                'branch_name' => 'Main Branch',
                'email_verified_at' => now(),
            ]
        );

        // 2. Create or update Cashier
        User::updateOrCreate(
            ['email' => 'cashier@luckyboba.com'], // Find by email
            [
                'name' => 'Cashier Ichigo',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
                'status' => 'ACTIVE',
                'branch_name' => null,
                'email_verified_at' => now(),
            ]
        );
    }
}