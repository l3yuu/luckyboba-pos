<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'bcode'          => '123456789',
            'posType'        => 'RESTO',
            'transDateDay'   => 'false',
            'serviceCharge'  => '0%',
            'voucherSurge'   => '0%',
            'scPwdDiscount'  => 'PAX',
            'transPerLine'   => 'false',
            'vatable'        => 'false',
            'customerPoints' => '0',
            'onlineCustomer' => 'true',
            'tableLayout'    => 'false',
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}