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
            ['email' => 'leumar@luckyboba.com'], // Find by email
            [
                'name' => 'Leumar Admin',
                'password' => Hash::make('leumar123'),
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
        ['email' => 'superadmin@luckyboba.com'],
        [
            'name' => 'Super Admin',
            'password' => Hash::make('super123'),
            'role' => 'superadmin',
            'branch_id' => '1',
            'status' => 'ACTIVE',
            'branch_name' => 'Main Branch',
            'email_verified_at' => now(),
        ]
    );
    User::updateOrCreate(
        ['email' => 'mainbranch@luckyboba.com'],
        [
            'name' => 'Main Branch',
            'password' => Hash::make('mainbranch123'),
            'role' => 'branch_manager',
            'branch_id' => '1',
            'status' => 'ACTIVE',
            'branch_name' => 'Main Branch',
            'email_verified_at' => now(),
        ]
    );
    }
}