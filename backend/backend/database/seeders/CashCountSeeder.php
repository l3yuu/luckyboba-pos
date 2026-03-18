<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CashCount;
use App\Models\User;
use Carbon\Carbon;

class CashCountSeeder extends Seeder
{
    public function run(): void
    {
        // Get your first user (likely the Admin QCU you showed in HeidiSQL)
        $user = User::first();

        if (!$user) return;

        $data = [
            [
                'terminal_id' => '01',
                'total_amount' => 5450.25,
                'actual_amount' => 5450.25,
                'breakdown' => [
                    '1000' => '5',
                    '100' => '4',
                    '50' => '1',
                    '0.25' => '1'
                ],
                'remarks' => 'Monday EOD - All clear',
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'terminal_id' => '01',
                'total_amount' => 3200.00,
                'actual_amount' => 5450.25,
                'breakdown' => [
                    '500' => '6',
                    '200' => '1'
                ],
                'remarks' => 'Tuesday EOD - Short by 5 pesos',
                'created_at' => Carbon::now()->subDay(),
            ],
            [
                'terminal_id' => '01',
                'total_amount' => 1250.75,
                'actual_amount' => 5450.25,
                'breakdown' => [
                    '1000' => '1',
                    '100' => '2',
                    '50' => '1',
                    '0.25' => '3'
                ],
                'remarks' => 'Wednesday EOD - Perfect match',
                'created_at' => Carbon::now(),
            ],
        ];

        foreach ($data as $record) {
            CashCount::create(array_merge($record, ['user_id' => $user->id]));
        }
    }
}