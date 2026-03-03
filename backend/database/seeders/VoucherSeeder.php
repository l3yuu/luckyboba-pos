<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Voucher;

class VoucherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vouchers = [
            [
                'code' => 'BOBA_FEST_2026',
                'value' => '20%',
                'status' => 'Active',
                'type' => 'Percentage',
                'receipt' => 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'LUCKY_100_OFF',
                'value' => '100.00',
                'status' => 'Active',
                'type' => 'Fixed Amount',
                'receipt' => 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'WELCOME_BOBA',
                'value' => '50.00',
                'status' => 'Inactive',
                'type' => 'Fixed Amount',
                'receipt' => 'N/A',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($vouchers as $voucher) {
            Voucher::updateOrCreate(['code' => $voucher['code']], $voucher);
        }
    }
}