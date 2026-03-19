<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Cup;
use App\Models\MenuItem;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $cupsById = Cup::all()->keyBy('id');

        $smsl   = Cup::where('code', 'SM/SL')->first()?->id;
        $jr     = Cup::where('code', 'JR')->first()?->id;
        $umul   = Cup::where('code', 'UM/UL')->first()?->id;
        $pcmpcl = Cup::where('code', 'PCM/PCL')->first()?->id;

        $categoryCupMap = [
            'CHICKEN WINGS'       => null,
            'ALA CARTE SNACKS'    => null,
            'ALL DAY MEALS'       => null,
            'COMBO MEALS'         => null,
            'AFFORDA-BOWLS'       => null,
            'WAFFLE'              => null,
            'CARD'                => null,
            'FREEBIES'            => null,
            'PROMOS'              => null,
            'GRAND OPENING PROMO' => null,
            'CHEESECAKE MILK TEA' => $smsl,
            'CREAM CHEESE M. TEA' => $smsl,
            'CREAM CHEESE MILK TEA' => $smsl,
            'FLAVORED MILK TEA'   => $smsl,
            'FRUIT SODA SERIES'   => $smsl,
            'GF DUO BUNDLES'      => $smsl,
            'FP/GF FET2 CLASSIC'  => $smsl,
            'GREEN TEA SERIES'    => $smsl,
            'ICED COFFEE'         => $smsl,
            'NOVA SERIES'         => $smsl,
            'OKINAWA BROWN SUGAR' => $smsl,
            'PUMPKIN SPICE'       => $smsl,
            'ROCK SALT & CHEESE'  => $smsl,
            'YAKULT SERIES'       => $smsl,
            'YOGURT SERIES'       => $smsl,
            'CLASSIC MILKTEA'     => $smsl,
            'COFFEE FRAPPE'       => $umul,
            'FP COFFEE BUNDLES'   => $umul,
            'HOLI-YEY'   => $umul,
            'FRAPPE SERIES'       => $umul,
            'HOT COFFEE'          => $pcmpcl,
            'HOT DRINKS'          => $pcmpcl,
            'LUCKY CLASSIC JR'    => $jr,
            'PIZZA PEDRICOS'      => null,
            'PIZZA PEDRICOS COMBO' => null,
        ];

        $cupSizeMap = [
            'SM/SL'   => ['M' => 'SM',  'L' => 'SL'],
            'JR'      => ['M' => 'JR',  'L' => 'JR'],
            'UM/UL'   => ['M' => 'UM',  'L' => 'UL'],
            'PCM/PCL' => ['M' => 'PCM', 'L' => 'PCL'],
        ];

        $menuData = [
            'AFFORDA-BOWLS' => [
                ['name' => "AFFORD-SIOMAI + RICE",         'price' => 59.00,  'barcode' => 'AB-1',  'size' => 'none', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "AFFORD-HOTDOG + RICE",         'price' => 59.00,  'barcode' => 'AB-2',  'size' => 'none', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "AFFORD-CHIC WINGS + RICE",     'price' => 69.00,  'barcode' => 'AB-3',  'size' => 'none', 'grab_price' => 43.00, 'panda_price' => 43.00],
                ['name' => "AFFORD-CHIC POPPERS + RICE",   'price' => 69.00,  'barcode' => 'AB-4',  'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "AFFORD-SHANGHAI + RICE",       'price' => 69.00,  'barcode' => 'AB-5',  'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "AFFORD-CHICK TONKATSU + RICE", 'price' => 79.00,  'barcode' => 'AB-6',  'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "AFFORD-LONGGA RICE + EGG",     'price' => 79.00,  'barcode' => 'AB-7',  'size' => 'none', 'grab_price' => 60.00, 'panda_price' => 60.00],
            ],
            'ALA CARTE SNACKS' => [
                ['name' => "Chicken Twister Wrap",  'price' => 85.00,  'barcode' => 'ACS-1', 'size' => 'none', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "Chicken Poppers Snack", 'price' => 99.00,  'barcode' => 'ACS-2', 'size' => 'none', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "Spaghetti",             'price' => 75.00,  'barcode' => 'ACS-3', 'size' => 'none', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "Thick Coated Fries",    'price' => 99.00,  'barcode' => 'ACS-4', 'size' => 'none', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "Cheesy Nachos",         'price' => 180.00, 'barcode' => 'ACS-5', 'size' => 'none', 'grab_price' => 85.00, 'panda_price' => 85.00],
                ['name' => "Bottled Mineral Water", 'price' => 25.00,  'barcode' => 'ACS-6', 'size' => 'none', 'grab_price' => 0.00,  'panda_price' => 0.00],
                ['name' => "Rice",                  'price' => 20.00,  'barcode' => 'ACS-7', 'size' => 'none', 'grab_price' => 5.00,  'panda_price' => 5.00],
                ['name' => "Hungarian Sausage Meal",'price' => 85.00,  'barcode' => 'HSM',   'size' => 'none', 'grab_price' => 50.00,  'panda_price' => 50.00],

            ],
            'ALL DAY MEALS' => [
                ['name' => "SPICY TAPA ALL DAY MEAL",       'price' => 135.00, 'barcode' => 'ADM-1', 'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "TONKATSU ALL DAY MEAL",         'price' => 120.00, 'barcode' => 'ADM-2', 'size' => 'none', 'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "3PCS CHICK WINGS ALL DAY MEAL", 'price' => 135.00, 'barcode' => 'ADM-3', 'size' => 'none', 'grab_price' => 85.00, 'panda_price' => 85.00],
                ['name' => "LONGGANISA ALL DAY MEAL",       'price' => 100.00, 'barcode' => 'ADM-4', 'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "CHICKEN POPPERS ALL DAY MEAL",  'price' => 135.00, 'barcode' => 'ADM-5', 'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
            ],
            'CHEESECAKE MILK TEA' => [
                ['name' => "VANILLA + CHEESECAKE",                    'price' => 115.00, 'barcode' => 'CCMM5',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "VANILLA + CHEESECAKE",                    'price' => 135.00, 'barcode' => 'CCML5',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "COOKIES & CREAM + CHEESECAKE",            'price' => 115.00, 'barcode' => 'CCMM10', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "COOKIES & CREAM + CHEESECAKE",            'price' => 135.00, 'barcode' => 'CCML10', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "STRAWBERRY + CHEESECAKE",                 'price' => 115.00, 'barcode' => 'CCMM3',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "STRAWBERRY + CHEESECAKE",                 'price' => 135.00, 'barcode' => 'CCML3',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "MANGO + CHEESECAKE",                      'price' => 115.00, 'barcode' => 'CCMM7',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "MANGO + CHEESECAKE",                      'price' => 135.00, 'barcode' => 'CCML7',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "SALTED CARAMEL + CHEESECAKE",             'price' => 115.00, 'barcode' => 'CCMM4',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "SALTED CARAMEL + CHEESECAKE",             'price' => 135.00, 'barcode' => 'CCML4',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "OKINAWA + CHEESECAKE",                    'price' => 115.00, 'barcode' => 'CCMM1',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "OKINAWA + CHEESECAKE",                    'price' => 135.00, 'barcode' => 'CCML1',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "CHOCO HAZELNUT + CHEESECAKE",             'price' => 115.00, 'barcode' => 'CCMM2',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CHOCO HAZELNUT + CHEESECAKE",             'price' => 135.00, 'barcode' => 'CCML2',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "TARO + CHEESECAKE",                       'price' => 115.00, 'barcode' => 'CCMM6',  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "TARO + CHEESECAKE",                       'price' => 135.00, 'barcode' => 'CCML6',  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "BELGIAN CHOCO M. TEA + CHEESECAKE",       'price' => 115.00, 'barcode' => 'BCCKM1', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "BELGIAN CHOCO M. TEA + CHEESECAKE",       'price' => 135.00, 'barcode' => 'BCCKL1', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "BLUEBERRY + CHEESECAKE",                  'price' => 115.00, 'barcode' => 'CCMM11', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "BLUEBERRY + CHEESECAKE",                  'price' => 135.00, 'barcode' => 'CCML11', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "MATCHA + CHEESECAKE",                     'price' => 115.00, 'barcode' => 'CCMM12', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "MATCHA + CHEESECAKE",                     'price' => 135.00, 'barcode' => 'CCML12', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
            ],
            'CHICKEN WINGS' => [
                ['name' => "BUFFALO",         'price' => 100.00, 'barcode' => 'CW3-1',  'size' => '3pc',  'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "BUFFALO",         'price' => 120.00, 'barcode' => 'CW4-1',  'size' => '4pc',  'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "BUFFALO",         'price' => 195.00, 'barcode' => 'CW6-1',  'size' => '6pc',  'grab_price' => 105.00, 'panda_price' => 105.00],
                ['name' => "BUFFALO",         'price' => 390.00, 'barcode' => 'CW12-1', 'size' => '12pc'],
                ['name' => "GARLIC PARMESAN", 'price' => 100.00, 'barcode' => 'CW3-2',  'size' => '3pc',  'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "GARLIC PARMESAN", 'price' => 120.00, 'barcode' => 'CW4-2',  'size' => '4pc',  'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "GARLIC PARMESAN", 'price' => 195.00, 'barcode' => 'CW6-2',  'size' => '6pc'],
                ['name' => "GARLIC PARMESAN", 'price' => 390.00, 'barcode' => 'CW12-2', 'size' => '12pc'],
                ['name' => "SWEET CHILI",     'price' => 100.00, 'barcode' => 'CW3-3',  'size' => '3pc',  'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "SWEET CHILI",     'price' => 120.00, 'barcode' => 'CW4-3',  'size' => '4pc',  'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "SWEET CHILI",     'price' => 195.00, 'barcode' => 'CW6-3',  'size' => '6pc',  'grab_price' => 105.00, 'panda_price' => 105.00],
                ['name' => "SWEET CHILI",     'price' => 390.00, 'barcode' => 'CW12-3', 'size' => '12pc'],
                ['name' => "TERIYAKI",        'price' => 100.00, 'barcode' => 'CW3-4',  'size' => '3pc',  'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "TERIYAKI",        'price' => 120.00, 'barcode' => 'CW4-4',  'size' => '4pc',  'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "TERIYAKI",        'price' => 195.00, 'barcode' => 'CW6-4',  'size' => '6pc',  'grab_price' => 105.00, 'panda_price' => 105.00],
                ['name' => "TERIYAKI",        'price' => 390.00, 'barcode' => 'CW12-4', 'size' => '12pc'],
                ['name' => "SOY GARLIC",      'price' => 100.00, 'barcode' => 'CW3-5',  'size' => '3pc',  'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "SOY GARLIC",      'price' => 120.00, 'barcode' => 'CW4-5',  'size' => '4pc',  'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "SOY GARLIC",      'price' => 195.00, 'barcode' => 'CW6-5',  'size' => '6pc',  'grab_price' => 105.00, 'panda_price' => 105.00],
                ['name' => "SOY GARLIC",      'price' => 390.00, 'barcode' => 'CW12-5', 'size' => '12pc'],
                ['name' => "SALTED EGG",      'price' => 100.00, 'barcode' => 'CW3-6',  'size' => '3pc',  'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "SALTED EGG",      'price' => 120.00, 'barcode' => 'CW4-6',  'size' => '4pc',  'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "SALTED EGG",      'price' => 195.00, 'barcode' => 'CW6-6',  'size' => '6pc',  'grab_price' => 105.00, 'panda_price' => 105.00],
                ['name' => "SALTED EGG",      'price' => 390.00, 'barcode' => 'CW12-6', 'size' => '12pc'],
            ],
            'CLASSIC MILKTEA' => [
                ['name' => "CLASSIC MILK TEA",          'price' => 70.00,  'barcode' => 'CMM1', 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "CLASSIC MILK TEA",          'price' => 90.00,  'barcode' => 'CML1', 'size' => 'L', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "CLASSIC PEARL",             'price' => 85.00,  'barcode' => 'CMM2', 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "CLASSIC PEARL",             'price' => 105.00, 'barcode' => 'CML2', 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "CLASSIC OREO",              'price' => 85.00,  'barcode' => 'CMM8', 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "CLASSIC OREO",              'price' => 105.00, 'barcode' => 'CML8', 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "CLASSIC PUDDING",           'price' => 95.00,  'barcode' => 'CMM9', 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "CLASSIC PUDDING",           'price' => 115.00, 'barcode' => 'CML9', 'size' => 'L', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CLASSIC BUDDY",             'price' => 105.00, 'barcode' => 'CMM3', 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "CLASSIC BUDDY",             'price' => 125.00, 'barcode' => 'CML3', 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "CLASSIC DUO",               'price' => 105.00, 'barcode' => 'CMM4', 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "CLASSIC DUO",               'price' => 125.00, 'barcode' => 'CML4', 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "CLASSIC CREAM CHEESE",      'price' => 115.00, 'barcode' => 'CMM5', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CLASSIC CREAM CHEESE",      'price' => 135.00, 'barcode' => 'CML5', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "CLASSIC CHEESE CAKE",       'price' => 115.00, 'barcode' => 'CMM6', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CLASSIC CHEESE CAKE",       'price' => 135.00, 'barcode' => 'CML6', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "CLASSIC ROCKSALT & CHEESE", 'price' => 115.00, 'barcode' => 'CMM7', 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CLASSIC ROCKSALT & CHEESE", 'price' => 135.00, 'barcode' => 'CML7', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],

                ['name' => "Classic Pudding + Black Pearl Milktea ", 'price' => 110.00, 'barcode' => 'CMM8', 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "Classic Pudding + Black Pearl Milktea ", 'price' => 130.00, 'barcode' => 'CML8', 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "Classic Pudding Mini White Pearl ", 'price' => 110.00, 'barcode' => 'CMM12', 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "Classic Pudding Mini White Pearl ", 'price' => 130.00, 'barcode' => 'CML12', 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ],
            'COFFEE FRAPPE' => [
                ['name' => "MOCHA FRAPPE",             'price' => 125.00, 'barcode' => 'CFM1', 'size' => 'M', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "MOCHA FRAPPE",             'price' => 145.00, 'barcode' => 'CFL1', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "VANILLA FRAPPE",           'price' => 125.00, 'barcode' => 'CFM2', 'size' => 'M', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "VANILLA FRAPPE",           'price' => 145.00, 'barcode' => 'CFL2', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "JAVA CHIP FRAPPE",         'price' => 125.00, 'barcode' => 'CFM3', 'size' => 'M', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "JAVA CHIP FRAPPE",         'price' => 145.00, 'barcode' => 'CFL3', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "TOFFEE CARAMEL FRAPPE",    'price' => 125.00, 'barcode' => 'CFM4', 'size' => 'M', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "TOFFEE CARAMEL FRAPPE",    'price' => 145.00, 'barcode' => 'CFL4', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "CARAMEL MACCHIATO FRAPPE", 'price' => 125.00, 'barcode' => 'CFM5', 'size' => 'M', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "CARAMEL MACCHIATO FRAPPE", 'price' => 145.00, 'barcode' => 'CFL5', 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
            ],
            'COMBO MEALS' => [
                ['name' => "THICK COATED FRIES & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM2',  'size' => 'none', 'grab_price' => 104.00, 'panda_price' => 104.00],
                ['name' => "CHICKEN TWISTER & CLASSIC PEARL",    'price' => 164.00, 'barcode' => 'COM4',  'size' => 'none', 'grab_price' => 69.00,  'panda_price' => 69.00],
                ['name' => "SPAGHETTI & CLASSIC PEARL",          'price' => 174.00, 'barcode' => 'COM6',  'size' => 'none', 'grab_price' => 43.00,  'panda_price' => 43.00],
                ['name' => "3PC CHICK WINGS & CLASSIC PEARL",    'price' => 174.00, 'barcode' => 'COM8',  'size' => 'none', 'grab_price' => 94.00,  'panda_price' => 94.00],
                ['name' => "CHEESY NACHOS & CLASSIC PEARL",      'price' => 174.00, 'barcode' => 'COM10', 'size' => 'none', 'grab_price' => 89.00,  'panda_price' => 89.00],
                ['name' => "CHICKEN POPPERS & CLASSIC PEARL",    'price' => 174.00, 'barcode' => 'COM12', 'size' => 'none', 'grab_price' => 70.00,  'panda_price' => 70.00],
            ],
            'CREAM CHEESE MILK TEA' => [
                ['name' => "RED VELVET + CREAM CHEESE",     'price' => 115.00, 'barcode' => "CRMM2",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "RED VELVET + CREAM CHEESE",     'price' => 135.00, 'barcode' => "CRML2",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "TARO + CREAM CHEESE",           'price' => 115.00, 'barcode' => "CRMM7",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "TARO + CREAM CHEESE",           'price' => 135.00, 'barcode' => "CRML7",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "VANILLA + CREAM CHEESE",        'price' => 115.00, 'barcode' => "CRMM5",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "VANILLA + CREAM CHEESE",        'price' => 135.00, 'barcode' => "CRML5",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "MATCHA + CREAM CHEESE",         'price' => 115.00, 'barcode' => "CRMM8",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "MATCHA + CREAM CHEESE",         'price' => 135.00, 'barcode' => "CRML8",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "BELGIAN CHOCO + CREAM CHEESE",  'price' => 115.00, 'barcode' => "CRMM1",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "BELGIAN CHOCO + CREAM CHEESE",  'price' => 135.00, 'barcode' => "CRML1",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "SALTED CARAMEL + CREAM CHEESE", 'price' => 115.00, 'barcode' => "CRMM4",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "SALTED CARAMEL + CREAM CHEESE", 'price' => 135.00, 'barcode' => "CRML4",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "HERSHEYS + CREAM CHEESE",       'price' => 115.00, 'barcode' => "CRMM3",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "HERSHEYS + CREAM CHEESE",       'price' => 135.00, 'barcode' => "CRML3",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "CHOCO HAZELNUT + CREAM CHEESE", 'price' => 115.00, 'barcode' => "CRMM9",  'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CHOCO HAZELNUT + CREAM CHEESE", 'price' => 135.00, 'barcode' => "CRML9",  'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "OKINAWA + CREAM CHEESE",        'price' => 115.00, 'barcode' => "CRMM10", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "OKINAWA + CREAM CHEESE",        'price' => 135.00, 'barcode' => "CRML10", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "BLUEBERRY + CREAM CHEESE",      'price' => 115.00, 'barcode' => "CRMM11", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "BLUEBERRY + CREAM CHEESE",      'price' => 135.00, 'barcode' => "CRML11", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
            ],
            'FLAVORED MILK TEA' => [
                ['name' => "WINTERMELON MILK TEA",     'price' => 85.00,  'barcode' => "FLMM4",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "WINTERMELON MILK TEA",     'price' => 105.00, 'barcode' => "FLML4",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "RED VELVET MILK TEA",      'price' => 85.00,  'barcode' => "FLMM13", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "RED VELVET MILK TEA",      'price' => 105.00, 'barcode' => "FLML13", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "AVOCADO MILK TEA",         'price' => 85.00,  'barcode' => "FLMM12", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "AVOCADO MILK TEA",         'price' => 105.00, 'barcode' => "FLML12", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "MANGO MILK TEA",           'price' => 85.00,  'barcode' => "FLMM11", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "MANGO MILK TEA",           'price' => 105.00, 'barcode' => "FLML11", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "TARO MILK TEA",            'price' => 85.00,  'barcode' => "FLMM2",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "TARO MILK TEA",            'price' => 105.00, 'barcode' => "FLML2",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "BELGIAN MILK TEA",         'price' => 85.00,  'barcode' => "FLMM10", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "BELGIAN MILK TEA",         'price' => 105.00, 'barcode' => "FLML10", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "HERSHEY'S MILK TEA",       'price' => 85.00,  'barcode' => "FLMM8",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "HERSHEY'S MILK TEA",       'price' => 105.00, 'barcode' => "FLML8",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "SALTED CARAMEL MILK TEA",  'price' => 85.00,  'barcode' => "FLMM3",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "SALTED CARAMEL MILK TEA",  'price' => 105.00, 'barcode' => "FLML3",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "CHOCO HAZELNUT MILK TEA",  'price' => 85.00,  'barcode' => "FLMM19", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "CHOCO HAZELNUT MILK TEA",  'price' => 105.00, 'barcode' => "FLML19", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "COOKIES & CREAM MILK TEA", 'price' => 85.00,  'barcode' => "FLMM15", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "COOKIES & CREAM MILK TEA", 'price' => 105.00, 'barcode' => "FLML15", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "TOFFEE CARAMEL MILK TEA",  'price' => 85.00,  'barcode' => "FLMM20", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "TOFFEE CARAMEL MILK TEA",  'price' => 105.00, 'barcode' => "FLML20", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "VANILLA MILK TEA",         'price' => 85.00,  'barcode' => "FLMM7",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "VANILLA MILK TEA",         'price' => 105.00, 'barcode' => "FLML7",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "BLUEBERRY MILK TEA",       'price' => 85.00,  'barcode' => "FLMM17", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "BLUEBERRY MILK TEA",       'price' => 105.00, 'barcode' => "FLML17", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "OKINAWA MILK TEA",         'price' => 85.00,  'barcode' => "FLMM6",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "OKINAWA MILK TEA",         'price' => 105.00, 'barcode' => "FLML6",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "MOCHA MILK TEA",           'price' => 85.00,  'barcode' => "FLMM9",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "MOCHA MILK TEA",           'price' => 105.00, 'barcode' => "FLML9",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "JAVA CHIP MILK TEA",       'price' => 85.00,  'barcode' => "FLMM5",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "JAVA CHIP MILK TEA",       'price' => 105.00, 'barcode' => "FLML5",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "MATCHA MILK TEA",          'price' => 85.00,  'barcode' => "FLMM1",  'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "MATCHA MILK TEA",          'price' => 105.00, 'barcode' => "FLML1",  'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "STRAWBERRY MILK TEA",      'price' => 85.00,  'barcode' => "FLMM16", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "STRAWBERRY MILK TEA",      'price' => 105.00, 'barcode' => "FLML16", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "DARK CHOCOLATE MILK TEA",  'price' => 85.00,  'barcode' => "FLMM18", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "DARK CHOCOLATE MILK TEA",  'price' => 105.00, 'barcode' => "FLML18", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
                ['name' => "CARAMEL MACCHIATO MILK TEA",  'price' => 85.00, 'barcode' => "FLCM30", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "CARAMEL MACCHIATO MILK TEA",  'price' => 105.00, 'barcode' => "FLCL30", 'size' => 'L', 'grab_price' => 55.00, 'panda_price' => 55.00],
            ],
            'FP COFFEE BUNDLES' => [
                ['name' => "TOFFEE CARAMEL ICED COFFEE + DARK ROAST COFFEE", 'price' => 154.00, 'barcode' => "COF1", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "VANILLA ICED COFFEE + JAVA CHIP COFEE FRP",      'price' => 250.00, 'barcode' => "COF2", 'size' => 'L', 'grab_price' => 75.00, 'panda_price' => 75.00],
            ],
            'HOLI-YEY' => [
                ['name' => "HOLI-YEY : STRAWBERRY CCAKE",              'price' => 175.00, 'barcode' => "HYSTRW", 'size' => 'L', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "HOLI-YEY : ROCKY ROAD CCAKE",              'price' => 175.00, 'barcode' => "HYRR", 'size' => 'L', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "HOLI-YEY : TIRAMISU CCAKE",              'price' => 185.00, 'barcode' => "HYT", 'size' => 'L', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "HOLI-YEY : BISCOFF MTEA",              'price' => 185.00, 'barcode' => "HYB", 'size' => 'L', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "HOLI-YEY : PISTACHIO HYPIS",              'price' => 185.00, 'barcode' => "HYPH", 'size' => 'L', 'grab_price' => 65.00, 'panda_price' => 65.00],
            ],
            'FRAPPE SERIES' => [
                ['name' => "TARO FRAPPE",            'price' => 110.00, 'barcode' => "FSM1", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "TARO FRAPPE",            'price' => 130.00, 'barcode' => "FSL1", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "BELGIAN CHOCO. FRAPPE",  'price' => 110.00, 'barcode' => "FSM7", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "BELGIAN CHOCO. FRAPPE",  'price' => 130.00, 'barcode' => "FSL7", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "HERSHEYS FRAPPE",        'price' => 110.00, 'barcode' => "FSM8", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "HERSHEYS FRAPPE",        'price' => 130.00, 'barcode' => "FSL8", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "CHOCO HAZELNUT FRAPPE",  'price' => 110.00, 'barcode' => "FSM3", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "CHOCO HAZELNUT FRAPPE",  'price' => 130.00, 'barcode' => "FSL3", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "SALTED CARAMEL FRAPPE",  'price' => 110.00, 'barcode' => "FSM4", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "SALTED CARAMEL FRAPPE",  'price' => 130.00, 'barcode' => "FSL4", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "DARK CHOCOLATE FRAPPE",  'price' => 110.00, 'barcode' => "FSM5", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "DARK CHOCOLATE FRAPPE",  'price' => 130.00, 'barcode' => "FSL5", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "COOKIES & CREAM FRAPPE", 'price' => 110.00, 'barcode' => "FSM6", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "COOKIES & CREAM FRAPPE", 'price' => 130.00, 'barcode' => "FSL6", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "RED VELVET FRAPPE",      'price' => 110.00, 'barcode' => "FSM2", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "RED VELVET FRAPPE",      'price' => 130.00, 'barcode' => "FSL2", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
            ],
            'FREEBIES' => [
                ['name' => "FREE TOTE BAG", 'price' => 0.00, 'barcode' => "TB1f", 'size' => 'none'],
                ['name' => "TUMBLER",       'price' => 0.00, 'barcode' => "TMB1", 'size' => 'none'],
                ['name' => "FLOWER",        'price' => 0.00, 'barcode' => "FL1",  'size' => 'none'],
                ['name' => "FREE MUG",      'price' => 0.00, 'barcode' => "FRMG", 'size' => 'none'],
            ],
            'FRUIT SODA SERIES' => [
                ['name' => "BLUEBERRY FRUIT SODA",   'price' => 125.00, 'barcode' => "FS1", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LYCHEE FRUIT SODA",      'price' => 125.00, 'barcode' => "FS3", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "BERRIES FRUIT SODA",     'price' => 125.00, 'barcode' => "FS2", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "STRAWBERRY FRUIT SODA",  'price' => 125.00, 'barcode' => "FS6", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "GREEN APPLE FRUIT SODA", 'price' => 125.00, 'barcode' => "FS5", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LEMON FRUIT SODA",       'price' => 125.00, 'barcode' => "FS4", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ],
            'GF DUO BUNDLES' => [
                ['name' => "SWEETY (WINTERMELON M.TEA + DARK CHOCOLATE RSC)",             'price' => 245.00, 'barcode' => "GF1", 'size' => 'L', 'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "CHEESY PARTNER (HERSHEY'S CHOCO CRMCHEESE + CL C.CAKE MTEA)",'price' => 270.00, 'barcode' => "GF2", 'size' => 'L', 'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "PERFECT MATCH (WMELON RSC + CL PEARL MILK TEA",               'price' => 240.00, 'barcode' => "GF3", 'size' => 'L', 'grab_price' => 80.00, 'panda_price' => 80.00],
                ['name' => "COUPLE'S CHOICE (BELGIAN CHOCO CRM. CHEESE + CL PEARL M.TEA",'price' => 240.00, 'barcode' => "GF4", 'size' => 'L', 'grab_price' => 80.00, 'panda_price' => 80.00],
            ],
            'FP/GF FET2 CLASSIC' => [
                ['name' => "2 CL PEARL M.TEA",   'price' => 210.00, 'barcode' => "2M",  'size' => 'L', 'grab_price' => 60.00, 'panda_price' => 60.00],
                ['name' => "2 CL BUDDY",         'price' => 210.00, 'barcode' => "1M",  'size' => 'L', 'grab_price' => 70.00, 'panda_price' => 70.00],
                ['name' => "2 CL PUDDING M.TEA", 'price' => 230.00, 'barcode' => "GC3", 'size' => 'L', 'grab_price' => 70.00, 'panda_price' => 70.00],
                ['name' => "2 CLASSICS RSC",     'price' => 270.00, 'barcode' => "GC2", 'size' => 'L', 'grab_price' => 80.00, 'panda_price' => 80.00],
            ],
            'GRAND OPENING PROMO' => [
                ['name' => "BOGO", 'price' => 85.00, 'barcode' => "B1G1M", 'size' => 'none', 'grab_price' => 0.00, 'panda_price' => 0.00],
            ],
            'GREEN TEA SERIES' => [
                ['name' => "WINTERMELON GREEN TEA",    'price' => 105.00, 'barcode' => "FTSM4", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "WINTERMELON GREEN TEA",    'price' => 125.00, 'barcode' => "FTSL4", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "HONEY LEMON GREEN TEA",    'price' => 105.00, 'barcode' => "FTSM3", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "HONEY LEMON GREEN TEA",    'price' => 125.00, 'barcode' => "FTSL3", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "PASSION FRUIT GREEN TEA",  'price' => 105.00, 'barcode' => "FTSM1", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "PASSION FRUIT GREEN TEA",  'price' => 125.00, 'barcode' => "FTSL1", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LEMON CUCUMBER GREEN TEA", 'price' => 105.00, 'barcode' => "FTSM5", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "LEMON CUCUMBER GREEN TEA", 'price' => 125.00, 'barcode' => "FTSL5", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LEMON CHIA GREEN TEA",     'price' => 105.00, 'barcode' => "FTSM2", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "LEMON CHIA GREEN TEA",     'price' => 125.00, 'barcode' => "FTSL2", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LYCHEE GREEN TEA",         'price' => 105.00, 'barcode' => "FTSM6", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "LYCHEE GREEN TEA",         'price' => 125.00, 'barcode' => "FTSL6", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ],
            'HOT COFFEE' => [
                ['name' => "DARK ROAST COFFEE",     'price' => 49.00, 'barcode' => "HFM1", 'size' => 'M', 'grab_price' => 20.00, 'panda_price' => 20.00],
                ['name' => "DARK ROAST COFFEE",     'price' => 59.00, 'barcode' => "HFL1", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "HOT MOCHA COFFEE",      'price' => 55.00, 'barcode' => "HFM3", 'size' => 'M', 'grab_price' => 20.00, 'panda_price' => 20.00],
                ['name' => "HOT MOCHA COFFEE",      'price' => 75.00, 'barcode' => "HFL3", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "HOT CARAMEL MACCHIATO", 'price' => 55.00, 'barcode' => "HFM2", 'size' => 'M', 'grab_price' => 20.00, 'panda_price' => 20.00],
                ['name' => "HOT CARAMEL MACCHIATO", 'price' => 75.00, 'barcode' => "HFL2", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
            ],
            'HOT DRINKS' => [
                ['name' => "HOT RED VELVET",   'price' => 55.00, 'barcode' => "HDM2", 'size' => 'M',    'grab_price' => 20.00, 'panda_price' => 20.00],
                ['name' => "HOT RED VELVET",   'price' => 75.00, 'barcode' => "HDL2", 'size' => 'L',    'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "HOT MATCHA",       'price' => 55.00, 'barcode' => "HDM3", 'size' => 'M',    'grab_price' => 20.00, 'panda_price' => 20.00],
                ['name' => "HOT MATCHA",       'price' => 75.00, 'barcode' => "HDL3", 'size' => 'L',    'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "HOT CHOCOLATE",    'price' => 55.00, 'barcode' => "HDM1", 'size' => 'M',    'grab_price' => 20.00, 'panda_price' => 20.00],
                ['name' => "HOT CHOCOLATE",    'price' => 75.00, 'barcode' => "HDL1", 'size' => 'L',    'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "CHOCOLATE SMORES", 'price' => 85.00, 'barcode' => "HDM4", 'size' => 'none', 'grab_price' => 0.00,  'panda_price' => 0.00],
            ],
            'ICED COFFEE' => [
                ['name' => "ICED COFFEE CLASSIC",    'price' => 85.00,  'barcode' => "ICM1", 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "ICED COFFEE CLASSIC",    'price' => 105.00, 'barcode' => "ICL1", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "ICED MOCHA COFFEE",      'price' => 85.00,  'barcode' => "ICM3", 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "ICED MOCHA COFFEE",      'price' => 105.00, 'barcode' => "ICL3", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "ICED VANILLA COFFEE",    'price' => 85.00,  'barcode' => "ICM2", 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "ICED VANILLA COFFEE",    'price' => 105.00, 'barcode' => "ICL2", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "ICED JAVA CHIP COFFEE",  'price' => 85.00,  'barcode' => "ICM5", 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "ICED JAVA CHIP COFFEE",  'price' => 105.00, 'barcode' => "ICL5", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "ICED TOFFEE CARAMEL",    'price' => 85.00,  'barcode' => "ICM4", 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "ICED TOFFEE CARAMEL",    'price' => 105.00, 'barcode' => "ICL4", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "ICED CARAMEL MACCHIATO", 'price' => 85.00,  'barcode' => "ICM6", 'size' => 'M', 'grab_price' => 25.00, 'panda_price' => 25.00],
                ['name' => "ICED CARAMEL MACCHIATO", 'price' => 105.00, 'barcode' => "ICL6", 'size' => 'L', 'grab_price' => 30.00, 'panda_price' => 30.00],
            ],
            'LUCKY CLASSIC JR' => [
                ['name' => "LUCKY CLASSIC OREO",        'price' => 55.00, 'barcode' => "LCO1",  'size' => 'none'],
                ['name' => "LUCKY CLASSIC BLACK PEARL", 'price' => 55.00, 'barcode' => "LCBP1", 'size' => 'none'],
                ['name' => "LUCKY CLASSIC WHITE PEARL", 'price' => 55.00, 'barcode' => "LCWP1", 'size' => 'none'],
                ['name' => "LUCKY CLASSIC PUDDING",     'price' => 55.00, 'barcode' => "LCPD1", 'size' => 'none'],
            ],
            'CARD' => [
                ['name' => "LUCKY CARD",                   'price' => 150.00, 'barcode' => "LC-001", 'size' => 'none'],
                ['name' => "LUCKY CARD CHRISTMAS EDITION", 'price' => 150.00, 'barcode' => "LC-002", 'size' => 'none'],
            ],
            'NOVA SERIES' => [
                ['name' => "BERRIES NOVA",     'price' => 125.00, 'barcode' => "NS2", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "MANGO LEMON NOVA", 'price' => 125.00, 'barcode' => "NS3", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LYCHEE LEM NOVA",  'price' => 125.00, 'barcode' => "NS1", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "STRAWBERRY NOVA",  'price' => 125.00, 'barcode' => "NS4", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "GREEN APPLE NOVA", 'price' => 125.00, 'barcode' => "NS5", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ],
            'OKINAWA BROWN SUGAR' => [
                ['name' => "OKINAWA BROWN SUGAR",                 'price' => 109.00, 'barcode' => "OKM1", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "OKINAWA BROWN SUGAR",                 'price' => 129.00, 'barcode' => "OKL1", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE",        'price' => 119.00, 'barcode' => "OKM2", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE",        'price' => 139.00, 'barcode' => "OKL2", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE + MILO", 'price' => 129.00, 'barcode' => "OKM3", 'size' => 'M', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE + MILO", 'price' => 149.00, 'barcode' => "OKL3", 'size' => 'L', 'grab_price' => 40.00, 'panda_price' => 40.00],
            ],
            'PIZZA PEDRICOS' => [
                ['name' => "Pizza Cheez and Cheez",           'price' => 69.00, 'barcode' => 'PPCC',  'size' => 'none', 'grab_price' => 0.00, 'panda_price' => 0.00],
                ['name' => "Pizza Ham and Cheez",             'price' => 69.00, 'barcode' => 'PPHC',  'size' => 'none', 'grab_price' => 0.00, 'panda_price' => 0.00],
                ['name' => "Pizza Chorizo and Cheez",         'price' => 69.00, 'barcode' => 'PPCHC', 'size' => 'none', 'grab_price' => 0.00, 'panda_price' => 0.00],
                ['name' => "Pizza Ham - Pineapple and Cheez", 'price' => 69.00, 'barcode' => 'PPHPC', 'size' => 'none', 'grab_price' => 0.00, 'panda_price' => 0.00],
            ],
            'PIZZA PEDRICOS COMBO' => [
                // Pizza + Classic Pearl (add-ons only)
                ['name' => "PIZZA + CLASSIC PEARL",                  'price' => 174.00, 'barcode' => 'PPC-CP1',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],

                // Pizza + Iced Coffee (all flavors except vanilla)
                ['name' => "PIZZA + ICED COFFEE CLASSIC",            'price' => 174.00, 'barcode' => 'PPC-IC1',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + ICED MOCHA COFFEE",              'price' => 174.00, 'barcode' => 'PPC-IC2',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + ICED JAVA CHIP COFFEE",          'price' => 174.00, 'barcode' => 'PPC-IC3',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + ICED TOFFEE CARAMEL",            'price' => 174.00, 'barcode' => 'PPC-IC4',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + ICED CARAMEL MACCHIATO",         'price' => 174.00, 'barcode' => 'PPC-IC5',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],

                // Pizza + Flavored Milk Tea (Cookies & Cream, Strawberry, Mango, Avocado, Belgian)
                ['name' => "PIZZA + COOKIES & CREAM MILK TEA",       'price' => 174.00, 'barcode' => 'PPC-FM1',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + STRAWBERRY MILK TEA",            'price' => 174.00, 'barcode' => 'PPC-FM2',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + MANGO MILK TEA",                 'price' => 174.00, 'barcode' => 'PPC-FM3',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + AVOCADO MILK TEA",               'price' => 174.00, 'barcode' => 'PPC-FM4',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + BELGIAN MILK TEA",               'price' => 174.00, 'barcode' => 'PPC-FM5',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],

                // Pizza + Yakult (all flavors except Green Tea and Strawberry)
                ['name' => "PIZZA + GREEN APPLE YAKULT",             'price' => 194.00, 'barcode' => 'PPC-YK1',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + LYCHEE YAKULT",                  'price' => 194.00, 'barcode' => 'PPC-YK2',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + BLUEBERRY YAKULT",               'price' => 194.00, 'barcode' => 'PPC-YK3',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + LEMON YAKULT",                   'price' => 194.00, 'barcode' => 'PPC-YK4',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + BERRIES YAKULT",                 'price' => 194.00, 'barcode' => 'PPC-YK5',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],

                // Pizza + Nova (all flavors)
                ['name' => "PIZZA + BERRIES NOVA",                   'price' => 194.00, 'barcode' => 'PPC-NV1',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + MANGO LEMON NOVA",               'price' => 194.00, 'barcode' => 'PPC-NV2',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + LYCHEE LEM NOVA",                'price' => 194.00, 'barcode' => 'PPC-NV3',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + STRAWBERRY NOVA",                'price' => 194.00, 'barcode' => 'PPC-NV4',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PIZZA + GREEN APPLE NOVA",               'price' => 194.00, 'barcode' => 'PPC-NV5',  'size' => 'none', 'grab_price' => 40.00, 'panda_price' => 40.00],
            ],
            'PUMPKIN SPICE' => [
                ['name' => "PUMPKIN SPICE MILK TEA",      'price' => 145.00, 'barcode' => "PO1", 'size' => 'L', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "PUMPKIN SPICE ICED COFFEE",   'price' => 165.00, 'barcode' => "PO4", 'size' => 'L', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "PUMPKIN SPICE COFFEE FRAPPE", 'price' => 195.00, 'barcode' => "PO5", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
            ],
            'ROCK SALT & CHEESE' => [
                ['name' => "VANILLA + ROCK SALT & CHEESE",        'price' => 115.00, 'barcode' => "RCM6", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "VANILLA + ROCK SALT & CHEESE",        'price' => 135.00, 'barcode' => "RCL6", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "DARK CHOCOLATE + ROCK SALT & CHEESE", 'price' => 115.00, 'barcode' => "RCM5", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "DARK CHOCOLATE + ROCK SALT & CHEESE", 'price' => 135.00, 'barcode' => "RCL5", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "WINTERMELON + ROCK SALT & CHEESE",    'price' => 115.00, 'barcode' => "RCM1", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "WINTERMELON + ROCK SALT & CHEESE",    'price' => 135.00, 'barcode' => "RCL1", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "MANGO + ROCK SALT & CHEESE",          'price' => 115.00, 'barcode' => "RCM2", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "MANGO + ROCK SALT & CHEESE",          'price' => 135.00, 'barcode' => "RCL2", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "AVOCADO + ROCK SALT & CHEESE",        'price' => 115.00, 'barcode' => "RCM3", 'size' => 'M', 'grab_price' => 40.00, 'panda_price' => 40.00],
                ['name' => "AVOCADO + ROCK SALT & CHEESE",        'price' => 135.00, 'barcode' => "RCL3", 'size' => 'L', 'grab_price' => 50.00, 'panda_price' => 50.00],
            ],
            'WAFFLE' => [
                ['name' => "WAFFLE BUTTER & HONEY",           'price' => 75.00,  'barcode' => "WFBT",      'size' => 'none', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "WAFFLE STRAWBERRY CHEESECAKE",    'price' => 145.00, 'barcode' => "WFSTCK",    'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "WAFFLE BLUEBERRY CHEESECAKE",     'price' => 145.00, 'barcode' => "WFBBBRYCK", 'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "WAFFLE BLUEBERRY CREAM CHEESE",   'price' => 145.00, 'barcode' => "WFBBRCCH",  'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "WAFFLE STRAWBERRY CREAM CHEESE",  'price' => 145.00, 'barcode' => "WFSTRCCHS", 'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "WAFFLE CREAM CHEESE CHOCO CHIPS", 'price' => 145.00, 'barcode' => "WFFCCHP",   'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "WAFFLE CHEESECAKE CHOCO CHIPS",   'price' => 145.00, 'barcode' => "WFCHIPS",   'size' => 'none', 'grab_price' => 45.00, 'panda_price' => 45.00],
                ['name' => "BFAST WAFFLE HAM",                'price' => 145.00, 'barcode' => "BFWHM",     'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "BFAST WAFFLE SPAM",               'price' => 155.00, 'barcode' => "BFWSPM",    'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "BFAST WAFFLE BACON",              'price' => 155.00, 'barcode' => "BFBCN",     'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "BFAST WAFFLE SAUSAGE",            'price' => 165.00, 'barcode' => "BFWSG",     'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "WAFFLE WHIP CREAM CHOCO CHIPS",   'price' => 105.00, 'barcode' => "WFWHP",     'size' => 'none'],
                ['name' => "WAFFLE WHIP CREAM STRAWBERRY",    'price' => 105.00, 'barcode' => "WFWHSTRW",  'size' => 'none'],
                ['name' => "WAFFLE WHIP CREAM BLUEBERRY",     'price' => 105.00, 'barcode' => "WFCBRY",    'size' => 'none'],
            ],
            'PROMOS' => [
                ['name' => "STUDENT FREE UPSIZE",         'price' => 0.00, 'barcode' => "STFUPZ",  'size' => 'none'],
                ['name' => "10% EMPLOYEE DISCOUNT",       'price' => 0.00, 'barcode' => "EMPDSC",  'size' => 'none'],
                ['name' => "GROCERY TIE UP -FREE UPSIZE", 'price' => 0.00, 'barcode' => "GCTP",    'size' => 'none'],
                ['name' => "LOYALTY CARD CLAIM",          'price' => 0.00, 'barcode' => "LCCCM",   'size' => 'none'],
                ['name' => "LUCKY CARD CLAIM -BOGO",      'price' => 0.00, 'barcode' => "LCBG",    'size' => 'none'],
                ['name' => "LUCKY CARD CLAIM -10%",       'price' => 0.00, 'barcode' => "LC10",    'size' => 'none'],
                ['name' => "FREE LARGE DRINK",            'price' => 0.00, 'barcode' => "FLDR",    'size' => 'none'],
                ['name' => "FREE MEDIUM DRINK",           'price' => 0.00, 'barcode' => "FLMD",    'size' => 'none'],
                ['name' => "FREE BLACK PEARL",            'price' => 0.00, 'barcode' => "FBPRL",   'size' => 'none'],
                ['name' => "FREE LUCKY CARD",             'price' => 0.00, 'barcode' => "FLLCKYC", 'size' => 'none'],
                ['name' => "FREE DELIVERY",               'price' => 0.00, 'barcode' => "FRDY",    'size' => 'none'],
            ],
            'YAKULT SERIES' => [
                ['name' => "GREEN APPLE YAKULT", 'price' => 105.00, 'barcode' => "YSM1", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "GREEN APPLE YAKULT", 'price' => 125.00, 'barcode' => "YSL1", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LYCHEE YAKULT",      'price' => 105.00, 'barcode' => "YSM3", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "LYCHEE YAKULT",      'price' => 125.00, 'barcode' => "YSL3", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "STRAWBERRY YAKULT",  'price' => 105.00, 'barcode' => "YSM2", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "STRAWBERRY YAKULT",  'price' => 125.00, 'barcode' => "YSL2", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "BLUEBERRY YAKULT",   'price' => 105.00, 'barcode' => "YSM6", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "BLUEBERRY YAKULT",   'price' => 125.00, 'barcode' => "YSL6", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "GREEN TEA YAKULT",   'price' => 105.00, 'barcode' => "YSM4", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "GREEN TEA YAKULT",   'price' => 125.00, 'barcode' => "YSL4", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "LEMON YAKULT",       'price' => 105.00, 'barcode' => "YSM5", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "LEMON YAKULT",       'price' => 125.00, 'barcode' => "YSL5", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
                ['name' => "BERRIES YAKULT",     'price' => 105.00, 'barcode' => "YSM7", 'size' => 'M', 'grab_price' => 30.00, 'panda_price' => 30.00],
                ['name' => "BERRIES YAKULT",     'price' => 125.00, 'barcode' => "YSL7", 'size' => 'L', 'grab_price' => 35.00, 'panda_price' => 35.00],
            ],
            'YOGURT SERIES' => [
                ['name' => "YOGURT PLAIN",         'price' => 105.00, 'barcode' => "YGOP",    'size' => 'none', 'grab_price' => 50.00, 'panda_price' => 50.00],
                ['name' => "YOGURT + STICKY RICE", 'price' => 125.00, 'barcode' => "YOGST",   'size' => 'none', 'grab_price' => 60.00, 'panda_price' => 60.00],
                ['name' => "YOGURT BLUEBERRY",     'price' => 135.00, 'barcode' => "YOGBRY",  'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
                ['name' => "YOGURT STRAWBERRY",    'price' => 135.00, 'barcode' => "YOGSTRY", 'size' => 'none', 'grab_price' => 65.00, 'panda_price' => 65.00],
            ],
        ];

        // Pre-load ALL sub-categories into a lookup: [category_id][sub_name] => sub_id
        $subCatLookup = [];
        \App\Models\SubCategory::all()->each(function ($sc) use (&$subCatLookup) {
            $subCatLookup[$sc->category_id][$sc->name] = $sc->id;
        });

        foreach ($menuData as $categoryName => $items) {
            $cupId = $categoryCupMap[$categoryName] ?? null;

            $category = Category::updateOrCreate(
                ['name' => $categoryName],
                ['cup_id' => $cupId]
            );

            $cup     = $cupId ? ($cupsById[$cupId] ?? null) : null;
            $cupCode = $cup?->code;
            $sizeMap = $cupSizeMap[$cupCode] ?? null;

            foreach ($items as $item) {
                $size     = $item['size'];
                $subCatId = null;

                if ($sizeMap && isset($sizeMap[$size])) {
                    $subCatName = $sizeMap[$size];
                    $subCatId   = $subCatLookup[$category->id][$subCatName] ?? null;
                } elseif (!in_array($size, ['M', 'L', 'none'])) {
                    $subCatId = $subCatLookup[$category->id][$size] ?? null;
                }

                // Use global MenuItem model to avoid category_id scope duplicates
                MenuItem::updateOrCreate(
                    ['barcode' => $item['barcode']],
                    [
                        'name'            => $item['name'],
                        'price'           => $item['price'],
                        'grab_price'      => $item['grab_price']  ?? 0,
                        'panda_price'     => $item['panda_price'] ?? 0,
                        'cup_id'          => $cupId,
                        'size'            => $size,
                        'sub_category_id' => $subCatId,
                        'category_id'     => $category->id,
                    ]
                );
            }

            $this->command->info("Seeded: {$categoryName} (" . count($items) . " items)");
        }
    }
}