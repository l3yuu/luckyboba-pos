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
                'role' => 'superadmin',
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
                'branch_id' => '1',
                'branch_name' => 'Main Branch',
                'email_verified_at' => now(),
            ]
        );
        User::updateOrCreate(
        ['email' => 'Superadmin@luckyboba.com'],
        [
            'name' => 'Super Admin',
            'password' => Hash::make('Super123'),
            'role' => 'superadmin',
            'branch_id' => '1',
            'status' => 'ACTIVE',
            'branch_name' => 'Main Branch',
            'email_verified_at' => now(),
        ]
    );
    User::updateOrCreate(
        ['email' => 'MainBranch@luckyboba.com'],
        [
            'name' => 'Main Branch',
            'password' => Hash::make('Main Branch'),
            'role' => 'branch_manager',
            'branch_id' => '1',
            'status' => 'ACTIVE',
            'branch_name' => 'Main Branch',
            'email_verified_at' => now(),
        ]
    );
    }
}