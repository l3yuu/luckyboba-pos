<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name'  => 'Maria Santos',
                'email' => 'maria.santos@gmail.com',
            ],
            [
                'name'  => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@gmail.com',
            ],
            [
                'name'  => 'Ana Reyes',
                'email' => 'ana.reyes@yahoo.com',
            ],
            [
                'name'  => 'Carlos Garcia',
                'email' => 'carlos.garcia@gmail.com',
            ],
            [
                'name'  => 'Sofia Mendoza',
                'email' => 'sofia.mendoza@outlook.com',
            ],
            [
                'name'  => 'Miguel Torres',
                'email' => 'miguel.torres@gmail.com',
            ],
            [
                'name'  => 'Isabella Cruz',
                'email' => 'isabella.cruz@gmail.com',
            ],
            [
                'name'  => 'Rafael Aquino',
                'email' => 'rafael.aquino@yahoo.com',
            ],
            [
                'name'  => 'Camille Villanueva',
                'email' => 'camille.v@gmail.com',
            ],
            [
                'name'  => 'Daniel Ramos',
                'email' => 'daniel.ramos@outlook.com',
            ],
        ];

        foreach ($customers as $customer) {
            User::updateOrCreate(
                ['email' => $customer['email']],
                [
                    'name'              => $customer['name'],
                    'password'          => Hash::make('customer123'),
                    'role'              => 'customer',
                    'status'            => 'ACTIVE',
                    'branch_id'         => null,
                    'branch_name'       => null,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
