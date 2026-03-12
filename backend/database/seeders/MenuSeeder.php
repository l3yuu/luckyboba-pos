<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Cup;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $cupsById = Cup::all()->keyBy('id');
        // Get cup IDs
        $smsl   = Cup::where('code', 'SM/SL')->first()?->id;
        $jr     = Cup::where('code', 'JR')->first()?->id;
        $umul   = Cup::where('code', 'UM/UL')->first()?->id;
        $pcmpcl = Cup::where('code', 'PCM/PCL')->first()?->id;

        // Map category name => cup_id (mirrors CategorySeeder)
        $categoryCupMap = [
            // FOOD / WINGS / PROMOS — no cup
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

            // SM/SL drinks
            'CHEESECAKE MILK TEA' => $smsl,
            'CREAM CHEESE M. TEA' => $smsl,
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

            // SM/SL drinks
            'CLASSIC MILKTEA'     => $smsl,

            // UM/UL drinks
            'COFFEE FRAPPE'       => $umul,
            'FP COFFEE BUNDLES'   => $umul,
            'FRAPPE SERIES'       => $umul,

            // PCM/PCL drinks
            'HOT COFFEE'          => $pcmpcl,
            'HOT DRINKS'          => $pcmpcl,
        ];

        $menuData = [
            'AFFORDA-BOWLS' => [
                ['name' => "AFFORD-SIOMAI + RICE",         'price' => 59.00,  'barcode' => 'AB-1',  'size' => 'none'],
                ['name' => "AFFORD-HOTDOG + RICE",         'price' => 59.00,  'barcode' => 'AB-2',  'size' => 'none'],
                ['name' => "AFFORD-CHICKEN WINGS + RICE",     'price' => 69.00,  'barcode' => 'AB-3',  'size' => 'none'],
                ['name' => "AFFORD-CHICKEN POPPERS + RICE",   'price' => 69.00,  'barcode' => 'AB-4',  'size' => 'none'],
                ['name' => "AFFORD-SHANGHAI + RICE",       'price' => 69.00,  'barcode' => 'AB-5',  'size' => 'none'],
                ['name' => "AFFORD-CHICKEN TONKATSU + RICE", 'price' => 79.00,  'barcode' => 'AB-6',  'size' => 'none'],
                ['name' => "AFFORD-LONGGANISA RICE + EGG",     'price' => 79.00,  'barcode' => 'AB-7',  'size' => 'none'],
            ],

            'ALA CARTE SNACKS' => [
                ['name' => "Chicken Twister Wrap",  'price' => 85.00,  'barcode' => 'ACS-1', 'size' => 'none'],
                ['name' => "Chicken Poppers Snack", 'price' => 99.00,  'barcode' => 'ACS-2', 'size' => 'none'],
                ['name' => "Spaghetti",             'price' => 75.00,  'barcode' => 'ACS-3', 'size' => 'none'],
                ['name' => "Spaghetti with Bread",  'price' => 85.00,  'barcode' => 'ACS-4', 'size' => 'none'],
                ['name' => "Thick Coated Fries",    'price' => 99.00,  'barcode' => 'ACS-5', 'size' => 'none'],
                ['name' => "Cheesy Nachos",         'price' => 180.00, 'barcode' => 'ACS-6', 'size' => 'none'],
                ['name' => "Bottled Mineral Water", 'price' => 25.00,  'barcode' => 'ACS-7', 'size' => 'none'],
                ['name' => "Rice",                  'price' => 20.00,  'barcode' => 'ACS-8', 'size' => 'none'],
            ],

            'ALL DAY MEALS' => [
                ['name' => "SPICY TAPA ALL DAY MEAL",       'price' => 135.00, 'barcode' => 'ADM-1', 'size' => 'none'],
                ['name' => "TONKATSU ALL DAY MEAL",         'price' => 120.00, 'barcode' => 'ADM-2', 'size' => 'none'],
                ['name' => "3PCS CHICK WINGS ALL DAY MEAL", 'price' => 135.00, 'barcode' => 'ADM-3', 'size' => 'none'],
                ['name' => "LONGGANISA ALL DAY MEAL",       'price' => 100.00, 'barcode' => 'ADM-4', 'size' => 'none'],
                ['name' => "CHICKEN POPPERS ALL DAY MEAL",  'price' => 135.00, 'barcode' => 'ADM-5', 'size' => 'none'],
            ],

            'CHEESECAKE MILK TEA' => [
                ['name' => "VANILLA + CHEESECAKE",         'price' => 115.00, 'barcode' => 'CCMM5',  'size' => 'M'],
                ['name' => "VANILLA + CHEESECAKE",         'price' => 135.00, 'barcode' => 'CCML5',  'size' => 'L'],
                ['name' => "COOKIES & CREAM + CHEESECAKE", 'price' => 115.00, 'barcode' => 'CCMM10', 'size' => 'M'],
                ['name' => "COOKIES & CREAM + CHEESECAKE", 'price' => 135.00, 'barcode' => 'CCML10', 'size' => 'L'],
                ['name' => "STRAWBERRY + CHEESECAKE",      'price' => 115.00, 'barcode' => 'CCMM3',  'size' => 'M'],
                ['name' => "STRAWBERRY + CHEESECAKE",      'price' => 135.00, 'barcode' => 'CCML3',  'size' => 'L'],
                ['name' => "MANGO + CHEESECAKE",           'price' => 115.00, 'barcode' => 'CCMM7',  'size' => 'M'],
                ['name' => "MANGO + CHEESECAKE",           'price' => 135.00, 'barcode' => 'CCML7',  'size' => 'L'],
                ['name' => "SALTED CARAMEL + CHEESECAKE",  'price' => 115.00, 'barcode' => 'CCMM4',  'size' => 'M'],
                ['name' => "SALTED CARAMEL + CHEESECAKE",  'price' => 135.00, 'barcode' => 'CCML4',  'size' => 'L'],
                ['name' => "OKINAWA + CHEESECAKE",         'price' => 115.00, 'barcode' => 'CCMM1',  'size' => 'M'],
                ['name' => "OKINAWA + CHEESECAKE",         'price' => 135.00, 'barcode' => 'CCML1',  'size' => 'L'],
                ['name' => "CHOCO HAZELNUT + CHEESECAKE",  'price' => 115.00, 'barcode' => 'CCMM2',  'size' => 'M'],
                ['name' => "CHOCO HAZELNUT + CHEESECAKE",  'price' => 135.00, 'barcode' => 'CCML2',  'size' => 'L'],
                ['name' => "TARO + CHEESECAKE",            'price' => 115.00, 'barcode' => 'CCMM6',  'size' => 'M'],
                ['name' => "TARO + CHEESECAKE",            'price' => 135.00, 'barcode' => 'CCML6',  'size' => 'L'],
            ],

            'CHICKEN WINGS' => [
                ['name' => "BUFFALO",         'price' => 100.00, 'barcode' => 'CW3-1',  'size' => '3pc'],
                ['name' => "BUFFALO",         'price' => 120.00, 'barcode' => 'CW4-1',  'size' => '4pc'],
                ['name' => "BUFFALO",         'price' => 195.00, 'barcode' => 'CW6-1',  'size' => '6pc'],
                ['name' => "BUFFALO",         'price' => 390.00, 'barcode' => 'CW12-1', 'size' => '12pc'],
                ['name' => "GARLIC PARMESAN", 'price' => 100.00, 'barcode' => 'CW3-2',  'size' => '3pc'],
                ['name' => "GARLIC PARMESAN", 'price' => 120.00, 'barcode' => 'CW4-2',  'size' => '4pc'],
                ['name' => "GARLIC PARMESAN", 'price' => 195.00, 'barcode' => 'CW6-2',  'size' => '6pc'],
                ['name' => "GARLIC PARMESAN", 'price' => 390.00, 'barcode' => 'CW12-2', 'size' => '12pc'],
                ['name' => "SWEET CHILI",     'price' => 100.00, 'barcode' => 'CW3-3',  'size' => '3pc'],
                ['name' => "SWEET CHILI",     'price' => 120.00, 'barcode' => 'CW4-3',  'size' => '4pc'],
                ['name' => "SWEET CHILI",     'price' => 195.00, 'barcode' => 'CW6-3',  'size' => '6pc'],
                ['name' => "SWEET CHILI",     'price' => 390.00, 'barcode' => 'CW12-3', 'size' => '12pc'],
                ['name' => "TERIYAKI",        'price' => 100.00, 'barcode' => 'CW3-4',  'size' => '3pc'],
                ['name' => "TERIYAKI",        'price' => 120.00, 'barcode' => 'CW4-4',  'size' => '4pc'],
                ['name' => "TERIYAKI",        'price' => 195.00, 'barcode' => 'CW6-4',  'size' => '6pc'],
                ['name' => "TERIYAKI",        'price' => 390.00, 'barcode' => 'CW12-4', 'size' => '12pc'],
                ['name' => "SOY GARLIC",      'price' => 100.00, 'barcode' => 'CW3-5',  'size' => '3pc'],
                ['name' => "SOY GARLIC",      'price' => 120.00, 'barcode' => 'CW4-5',  'size' => '4pc'],
                ['name' => "SOY GARLIC",      'price' => 195.00, 'barcode' => 'CW6-5',  'size' => '6pc'],
                ['name' => "SOY GARLIC",      'price' => 390.00, 'barcode' => 'CW12-5', 'size' => '12pc'],
                ['name' => "SALTED EGG",      'price' => 100.00, 'barcode' => 'CW3-6',  'size' => '3pc'],
                ['name' => "SALTED EGG",      'price' => 120.00, 'barcode' => 'CW4-6',  'size' => '4pc'],
                ['name' => "SALTED EGG",      'price' => 195.00, 'barcode' => 'CW6-6',  'size' => '6pc'],
                ['name' => "SALTED EGG",      'price' => 390.00, 'barcode' => 'CW12-6', 'size' => '12pc'],
            ],

            'CLASSIC MILKTEA' => [
                ['name' => "CLASSIC MILK TEA",         'price' => 70.00,  'barcode' => 'CMM1',  'size' => 'M'],
                ['name' => "CLASSIC MILK TEA",         'price' => 90.00,  'barcode' => 'CML1',  'size' => 'L'],
                ['name' => "CLASSIC PEARL",   'price' => 85.00,  'barcode' => 'CMM2',  'size' => 'M'],
                ['name' => "CLASSIC PEARL",   'price' => 105.00, 'barcode' => 'CML2',  'size' => 'L'],
                ['name' => "CLASSIC OREO",  'price' => 85.00,  'barcode' => 'CMM8',  'size' => 'M'],
                ['name' => "CLASSIC OREO",  'price' => 105.00, 'barcode' => 'CML8',  'size' => 'L'],
                ['name' => "CLASSIC PUDDING",'price' => 95.00,  'barcode' => 'CMM9',  'size' => 'M'],
                ['name' => "CLASSIC PUDDING",'price' => 115.00, 'barcode' => 'CML9',  'size' => 'L'],
                ['name' => "CLASSIC BUDDY",   'price' => 105.00, 'barcode' => 'CMM3',  'size' => 'M'],
                ['name' => "CLASSIC BUDDY",   'price' => 125.00, 'barcode' => 'CML3',  'size' => 'L'],
                ['name' => "CLASSIC DUO",     'price' => 105.00, 'barcode' => 'CMM4',  'size' => 'M'],
                ['name' => "CLASSIC DUO",     'price' => 125.00, 'barcode' => 'CML4',  'size' => 'L'],
                ['name' => "CLASSIC CREAM CHEESE",    'price' => 115.00, 'barcode' => 'CMM5',  'size' => 'M'],
                ['name' => "CLASSIC CREAM CHEESE",    'price' => 135.00, 'barcode' => 'CML5',  'size' => 'L'],
                ['name' => "CLASSIC CHEESE CAKE", 'price' => 115.00, 'barcode' => 'CMM6',  'size' => 'M'],
                ['name' => "CLASSIC CHEESE CAKE", 'price' => 135.00, 'barcode' => 'CML6',  'size' => 'L'],
                ['name' => "CLASSIC ROCKSALT & CHEESE",     'price' => 115.00, 'barcode' => 'CMM7',  'size' => 'M'],
                ['name' => "CLASSIC ROCKSALT & CHEESE",     'price' => 135.00, 'barcode' => 'CML7',  'size' => 'L'],
            ],

            'COFFEE FRAPPE' => [
                ['name' => "MOCHA FRAPPE",             'price' => 125.00, 'barcode' => 'CFM1', 'size' => 'M'],
                ['name' => "MOCHA FRAPPE",             'price' => 145.00, 'barcode' => 'CFL1', 'size' => 'L'],
                ['name' => "VANILLA FRAPPE",           'price' => 125.00, 'barcode' => 'CFM2', 'size' => 'M'],
                ['name' => "VANILLA FRAPPE",           'price' => 145.00, 'barcode' => 'CFL2', 'size' => 'L'],
                ['name' => "JAVA CHIP FRAPPE",         'price' => 125.00, 'barcode' => 'CFM3', 'size' => 'M'],
                ['name' => "JAVA CHIP FRAPPE",         'price' => 145.00, 'barcode' => 'CFL3', 'size' => 'L'],
                ['name' => "TOFFEE CARAMEL FRAPPE",    'price' => 125.00, 'barcode' => 'CFM4', 'size' => 'M'],
                ['name' => "TOFFEE CARAMEL FRAPPE",    'price' => 145.00, 'barcode' => 'CFL4', 'size' => 'L'],
                ['name' => "CARAMEL MACCHIATO FRAPPE", 'price' => 125.00, 'barcode' => 'CFM5', 'size' => 'M'],
                ['name' => "CARAMEL MACCHIATO FRAPPE", 'price' => 145.00, 'barcode' => 'CFL5', 'size' => 'L'],
            ],

            'COMBO MEALS' => [
                ['name' => "THICK COATED FRIES & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM2',  'size' => 'none'],
                ['name' => "CHICKEN TWISTER & CLASSIC PEARL",    'price' => 164.00, 'barcode' => 'COM4',  'size' => 'none'],
                ['name' => "SPAGHETTI & CLASSIC PEARL",          'price' => 174.00, 'barcode' => 'COM6',  'size' => 'none'],
                ['name' => "3PC CHICK WINGS & CLASSIC PEARL",    'price' => 174.00, 'barcode' => 'COM8',  'size' => 'none'],
                ['name' => "CHEESY NACHOS & CLASSIC PEARL",      'price' => 174.00, 'barcode' => 'COM10', 'size' => 'none'],
                ['name' => "CHICKEN POPPERS & CLASSIC PEARL",    'price' => 174.00, 'barcode' => 'COM12', 'size' => 'none'],
            ],

            'CREAM CHEESE MILK TEA' => [
                ['name' => "RED VELVET + CREAM CHEESE",      'price' => 115.00, 'barcode' => "CRMM2", 'size' => 'M'],
                ['name' => "RED VELVET + CREAM CHEESE",      'price' => 135.00, 'barcode' => "CRML2", 'size' => 'L'],
                ['name' => "TARO + CREAM CHEESE",            'price' => 115.00, 'barcode' => "CRMM7", 'size' => 'M'],
                ['name' => "TARO + CREAM CHEESE",            'price' => 135.00, 'barcode' => "CRML7", 'size' => 'L'],
                ['name' => "VANILLA + CREAM CHEESE",         'price' => 115.00, 'barcode' => "CRMM5", 'size' => 'M'],
                ['name' => "VANILLA + CREAM CHEESE",         'price' => 135.00, 'barcode' => "CRML5", 'size' => 'L'],
                ['name' => "MATCHA + CREAM CHEESE",          'price' => 115.00, 'barcode' => "CRMM8", 'size' => 'M'],
                ['name' => "MATCHA + CREAM CHEESE",          'price' => 135.00, 'barcode' => "CRML8", 'size' => 'L'],
                ['name' => "BELGIAN CHOCO + CREAM CHEESE",   'price' => 115.00, 'barcode' => "CRMM1", 'size' => 'M'],
                ['name' => "BELGIAN CHOCO + CREAM CHEESE",   'price' => 135.00, 'barcode' => "CRML1", 'size' => 'L'],
                ['name' => "SALTED CARAMEL + CREAM CHEESE",  'price' => 115.00, 'barcode' => "CRMM4", 'size' => 'M'],
                ['name' => "SALTED CARAMEL + CREAM CHEESE",  'price' => 135.00, 'barcode' => "CRML4", 'size' => 'L'],
                ['name' => "HERSHEYS + CREAM CHEESE",        'price' => 115.00, 'barcode' => "CRMM3", 'size' => 'M'],
                ['name' => "HERSHEYS + CREAM CHEESE",        'price' => 135.00, 'barcode' => "CRML3", 'size' => 'L'],
            ],

            'FLAVORED MILK TEA' => [
                ['name' => "WINTERMELON MILK TEA",          'price' => 85.00,  'barcode' => "FLMM4",  'size' => 'M'],
                ['name' => "WINTERMELON MILK TEA",          'price' => 105.00, 'barcode' => "FLML4",  'size' => 'L'],
                ['name' => "RED VELVET MILK TEA",           'price' => 85.00,  'barcode' => "FLMM13", 'size' => 'M'],
                ['name' => "RED VELVET MILK TEA",           'price' => 105.00, 'barcode' => "FLML13", 'size' => 'L'],
                ['name' => "AVOCADO MILK TEA",              'price' => 85.00,  'barcode' => "FLMM12", 'size' => 'M'],
                ['name' => "AVOCADO MILK TEA",              'price' => 105.00, 'barcode' => "FLML12", 'size' => 'L'],
                ['name' => "MANGO MILK TEA",                'price' => 85.00,  'barcode' => "FLMM11", 'size' => 'M'],
                ['name' => "MANGO MILK TEA",                'price' => 105.00, 'barcode' => "FLML11", 'size' => 'L'],
                ['name' => "TARO MILK TEA",                 'price' => 85.00,  'barcode' => "FLMM2",  'size' => 'M'],
                ['name' => "TARO MILK TEA",                 'price' => 105.00, 'barcode' => "FLML2",  'size' => 'L'],
                ['name' => "BELGIAN MILK TEA",              'price' => 85.00,  'barcode' => "FLMM10", 'size' => 'M'],
                ['name' => "BELGIAN MILK TEA",              'price' => 105.00, 'barcode' => "FLML10", 'size' => 'L'],
                ['name' => "HERSHEY'S MILK TEA",            'price' => 85.00,  'barcode' => "FLMM8",  'size' => 'M'],
                ['name' => "HERSHEY'S MILK TEA",            'price' => 105.00, 'barcode' => "FLML8",  'size' => 'L'],
                ['name' => "SALTED CARAMEL MILK TEA",       'price' => 85.00,  'barcode' => "FLMM3",  'size' => 'M'],
                ['name' => "SALTED CARAMEL MILK TEA",       'price' => 105.00, 'barcode' => "FLML3",  'size' => 'L'],
                ['name' => "CHOCO HAZELNUT MILK TEA",       'price' => 85.00,  'barcode' => "FLMM19", 'size' => 'M'],
                ['name' => "CHOCO HAZELNUT MILK TEA",       'price' => 105.00, 'barcode' => "FLML19", 'size' => 'L'],
                ['name' => "COOKIES & CREAM MILK TEA",      'price' => 85.00,  'barcode' => "FLMM15", 'size' => 'M'],
                ['name' => "COOKIES & CREAM MILK TEA",      'price' => 105.00, 'barcode' => "FLML15", 'size' => 'L'],
                ['name' => "TOFFEE CARAMEL MILK TEA",       'price' => 85.00,  'barcode' => "FLMM20", 'size' => 'M'],
                ['name' => "TOFFEE CARAMEL MILK TEA",       'price' => 105.00, 'barcode' => "FLML20", 'size' => 'L'],
                ['name' => "VANILLA MILK TEA",              'price' => 85.00,  'barcode' => "FLMM7",  'size' => 'M'],
                ['name' => "VANILLA MILK TEA",              'price' => 105.00, 'barcode' => "FLML7",  'size' => 'L'],
                ['name' => "BLUEBERRY MILK TEA",            'price' => 85.00,  'barcode' => "FLMM17", 'size' => 'M'],
                ['name' => "BLUEBERRY MILK TEA",            'price' => 105.00, 'barcode' => "FLML17", 'size' => 'L'],
                ['name' => "OKINAWA MILK TEA",              'price' => 85.00,  'barcode' => "FLMM6",  'size' => 'M'],
                ['name' => "OKINAWA MILK TEA",              'price' => 105.00, 'barcode' => "FLML6",  'size' => 'L'],
                ['name' => "MOCHA MILK TEA",                'price' => 85.00,  'barcode' => "FLMM9",  'size' => 'M'],
                ['name' => "MOCHA MILK TEA",                'price' => 105.00, 'barcode' => "FLML9",  'size' => 'L'],
                ['name' => "JAVA CHIP MILK TEA",            'price' => 85.00,  'barcode' => "FLMM5",  'size' => 'M'],
                ['name' => "JAVA CHIP MILK TEA",            'price' => 105.00, 'barcode' => "FLML5",  'size' => 'L'],
                ['name' => "MATCHA MILK TEA",               'price' => 85.00,  'barcode' => "FLMM1",  'size' => 'M'],
                ['name' => "MATCHA MILK TEA",               'price' => 105.00, 'barcode' => "FLML1",  'size' => 'L'],
                ['name' => "STRAWBERRY MILK TEA",           'price' => 85.00,  'barcode' => "FLMM16", 'size' => 'M'],
                ['name' => "STRAWBERRY MILK TEA",           'price' => 105.00, 'barcode' => "FLML16", 'size' => 'L'],
                ['name' => "DARK CHOCOLATE MILK TEA",       'price' => 85.00,  'barcode' => "FLMM18", 'size' => 'M'],
                ['name' => "DARK CHOCOLATE MILK TEA",       'price' => 105.00, 'barcode' => "FLML18", 'size' => 'L'],
            ],

            'FP COFFEE BUNDLES' => [
                ['name' => "TOF.CARAMEL ICED COFFEE + DK ROAST COFFEE", 'price' => 154.00, 'barcode' => "COF1", 'size' => 'L'],
                ['name' => "VANILLA ICED COFFEE + J.CHIP COFEE FRP",       'price' => 250.00, 'barcode' => "COF2", 'size' => 'L'],
            ],

            'FRAPPE SERIES' => [
                ['name' => "TARO FRAPPE",            'price' => 110.00, 'barcode' => "FSM1", 'size' => 'M'],
                ['name' => "TARO FRAPPE",            'price' => 130.00, 'barcode' => "FSL1", 'size' => 'L'],
                ['name' => "BELGIAN CHOCO. FRAPPE",  'price' => 110.00, 'barcode' => "FSM7", 'size' => 'M'],
                ['name' => "BELGIAN CHOCO. FRAPPE",  'price' => 130.00, 'barcode' => "FSL7", 'size' => 'L'],
                ['name' => "HERSHEYS FRAPPE",        'price' => 110.00, 'barcode' => "FSM8", 'size' => 'M'],
                ['name' => "HERSHEYS FRAPPE",        'price' => 130.00, 'barcode' => "FSL8", 'size' => 'L'],
                ['name' => "CHOCO HAZELNUT FRAPPE",  'price' => 110.00, 'barcode' => "FSM3", 'size' => 'M'],
                ['name' => "CHOCO HAZELNUT FRAPPE",  'price' => 130.00, 'barcode' => "FSL3", 'size' => 'L'],
                ['name' => "SALTED CARAMEL FRAPPE",  'price' => 110.00, 'barcode' => "FSM4", 'size' => 'M'],
                ['name' => "SALTED CARAMEL FRAPPE",  'price' => 130.00, 'barcode' => "FSL4", 'size' => 'L'],
                ['name' => "DARK CHOCOLATE FRAPPE",  'price' => 110.00, 'barcode' => "FSM5", 'size' => 'M'],
                ['name' => "DARK CHOCOLATE FRAPPE",  'price' => 130.00, 'barcode' => "FSL5", 'size' => 'L'],
                ['name' => "COOKIES & CREAM FRAPPE", 'price' => 110.00, 'barcode' => "FSM6", 'size' => 'M'],
                ['name' => "COOKIES & CREAM FRAPPE", 'price' => 130.00, 'barcode' => "FSL6", 'size' => 'L'],
                ['name' => "RED VELVET FRAPPE",      'price' => 110.00, 'barcode' => "FSM2", 'size' => 'M'],
                ['name' => "RED VELVET FRAPPE",      'price' => 130.00, 'barcode' => "FSL2", 'size' => 'L'],
            ],

            'FREEBIES' => [
                ['name' => "FREE TOTE BAG", 'price' => 0.00, 'barcode' => "TB1f", 'size' => 'none'],
                ['name' => "TUMBLER",       'price' => 0.00, 'barcode' => "TMB1", 'size' => 'none'],
                ['name' => "FLOWER",        'price' => 0.00, 'barcode' => "FL1",  'size' => 'none'],
                ['name' => "FREE MUG",      'price' => 0.00, 'barcode' => "FRMG", 'size' => 'none'],
            ],

            'FRUIT SODA SERIES' => [
                ['name' => "BLUEBERRY FRUIT SODA",   'price' => 125.00, 'barcode' => "FS1", 'size' => 'L'],
                ['name' => "LYCHEE FRUIT SODA",      'price' => 125.00, 'barcode' => "FS3", 'size' => 'L'],
                ['name' => "BERRIES FRUIT SODA",     'price' => 125.00, 'barcode' => "FS2", 'size' => 'L'],
                ['name' => "STRAWBERRY FRUIT SODA",  'price' => 125.00, 'barcode' => "FS6", 'size' => 'L'],
                ['name' => "GREEN APPLE FRUIT SODA", 'price' => 125.00, 'barcode' => "FS5", 'size' => 'L'],
                ['name' => "LEMON FRUIT SODA",       'price' => 125.00, 'barcode' => "FS4", 'size' => 'L'],
            ],

            'GF DUO BUNDLES' => [
                ['name' => "SWEETY (WINTERMELON M.TEA + DARK CHOCOLATE RSC)",                    'price' => 245.00, 'barcode' => "GF1", 'size' => 'L'],
                ['name' => "CHEESY PARTNER (HERSHEY'S CHOCO CRMCHEESE + CL C.CAKE MTEA)",  'price' => 270.00, 'barcode' => "GF2", 'size' => 'L'],
                ['name' => "PERFECT MATCH (WMELON RSC + CL PEARL MILK TEA",                'price' => 240.00, 'barcode' => "GF3", 'size' => 'L'],
                ['name' => "COUPLE'S CHOICE (BELGIAN CHOCO CRM. CHEESE + CL PEARL M.TEA", 'price' => 240.00, 'barcode' => "GF4", 'size' => 'L'],
            ],

            'FP/GF FET2 CLASSIC' => [
                ['name' => "2 CL PEARL M.TEA",   'price' => 210.00, 'barcode' => "2M",  'size' => 'L'],
                ['name' => "2 CL BUDDY",         'price' => 210.00, 'barcode' => "1M",  'size' => 'L'],
                ['name' => "2 CL PUDDING M.TEA", 'price' => 230.00, 'barcode' => "GC3", 'size' => 'L'],
                ['name' => "2 CLASSICS RSC",     'price' => 270.00, 'barcode' => "GC2", 'size' => 'L'],
            ],

            'GRAND OPENING PROMO' => [
                ['name' => "BOGO", 'price' => 85.00, 'barcode' => "B1G1M", 'size' => 'none'],
            ],

            'GREEN TEA SERIES' => [
                ['name' => "WINTERMELON GREEN TEA",    'price' => 105.00, 'barcode' => "FTSM4", 'size' => 'M'],
                ['name' => "WINTERMELON GREEN TEA",    'price' => 125.00, 'barcode' => "FTSL4", 'size' => 'L'],
                ['name' => "HONEY LEMON GREEN TEA",    'price' => 105.00, 'barcode' => "FTSM3", 'size' => 'M'],
                ['name' => "HONEY LEMON GREEN TEA",    'price' => 125.00, 'barcode' => "FTSL3", 'size' => 'L'],
                ['name' => "PASSION FRUIT GREEN TEA",  'price' => 105.00, 'barcode' => "FTSM1", 'size' => 'M'],
                ['name' => "PASSION FRUIT GREEN TEA",  'price' => 125.00, 'barcode' => "FTSL1", 'size' => 'L'],
                ['name' => "LEMON CUCUMBER GREEN TEA", 'price' => 105.00, 'barcode' => "FTSM5", 'size' => 'M'],
                ['name' => "LEMON CUCUMBER GREEN TEA", 'price' => 125.00, 'barcode' => "FTSL5", 'size' => 'L'],
                ['name' => "LEMON CHIA GREEN TEA",     'price' => 105.00, 'barcode' => "FTSM2", 'size' => 'M'],
                ['name' => "LEMON CHIA GREEN TEA",     'price' => 125.00, 'barcode' => "FTSL2", 'size' => 'L'],
                ['name' => "LYCHEE GREEN TEA",         'price' => 105.00, 'barcode' => "FTSM6", 'size' => 'M'],
                ['name' => "LYCHEE GREEN TEA",         'price' => 125.00, 'barcode' => "FTSL6", 'size' => 'L'],
            ],

            'HOT COFFEE' => [
                ['name' => "DARK ROAST COFFEE",        'price' => 49.00, 'barcode' => "HFM1", 'size' => 'M'],
                ['name' => "DARK ROAST COFFEE",        'price' => 59.00, 'barcode' => "HFL1", 'size' => 'L'],
                ['name' => "HOT MOCHA COFFEE",         'price' => 55.00, 'barcode' => "HFM3", 'size' => 'M'],
                ['name' => "HOT MOCHA COFFEE",         'price' => 75.00, 'barcode' => "HFL3", 'size' => 'L'],
                ['name' => "HOT CARAMEL MACCHIATO",    'price' => 55.00, 'barcode' => "HFM2", 'size' => 'M'],
                ['name' => "HOT CARAMEL MACCHIATO",    'price' => 75.00, 'barcode' => "HFL2", 'size' => 'L'],
            ],

            'HOT DRINKS' => [
                ['name' => "HOT RED VELVET",       'price' => 55.00, 'barcode' => "HDM2", 'size' => 'M'],
                ['name' => "HOT RED VELVET",       'price' => 75.00, 'barcode' => "HDL2", 'size' => 'L'],
                ['name' => "HOT MATCHA",           'price' => 55.00, 'barcode' => "HDM3", 'size' => 'M'],
                ['name' => "HOT MATCHA",           'price' => 75.00, 'barcode' => "HDL3", 'size' => 'L'],
                ['name' => "HOT CHOCOLATE",        'price' => 55.00, 'barcode' => "HDM1", 'size' => 'M'],
                ['name' => "HOT CHOCOLATE",        'price' => 75.00, 'barcode' => "HDL1", 'size' => 'L'],
                ['name' => "CHOCOLATE SMORES",     'price' => 85.00, 'barcode' => "HDM4", 'size' => 'none'],
            ],

            'ICED COFFEE' => [
                ['name' => "ICED COFFEE CLASSIC",      'price' => 85.00,  'barcode' => "ICM1", 'size' => 'M'],
                ['name' => "ICED COFFEE CLASSIC",      'price' => 105.00, 'barcode' => "ICL1", 'size' => 'L'],
                ['name' => "ICED MOCHA COFFEE",        'price' => 85.00,  'barcode' => "ICM3", 'size' => 'M'],
                ['name' => "ICED MOCHA COFFEE",        'price' => 105.00, 'barcode' => "ICL3", 'size' => 'L'],
                ['name' => "ICED VANILLA COFFEE",      'price' => 85.00,  'barcode' => "ICM2", 'size' => 'M'],
                ['name' => "ICED VANILLA COFFEE",      'price' => 105.00, 'barcode' => "ICL2", 'size' => 'L'],
                ['name' => "ICED JAVA CHIP COFFEE",    'price' => 85.00,  'barcode' => "ICM5", 'size' => 'M'],
                ['name' => "ICED JAVA CHIP COFFEE",    'price' => 105.00, 'barcode' => "ICL5", 'size' => 'L'],
                ['name' => "ICED TOFFEE CARAMEL",      'price' => 85.00,  'barcode' => "ICM4", 'size' => 'M'],
                ['name' => "ICED TOFFEE CARAMEL",      'price' => 105.00, 'barcode' => "ICL4", 'size' => 'L'],
                ['name' => "ICED CARAMEL MACCHIATO",   'price' => 85.00,  'barcode' => "ICM6", 'size' => 'M'],
                ['name' => "ICED CARAMEL MACCHIATO",   'price' => 105.00, 'barcode' => "ICL6", 'size' => 'L'],
            ],
            
            'CARD' => [
                ['name' => "LUCKY CARD",                   'price' => 150.00, 'barcode' => "LC-001", 'size' => 'none'],
                ['name' => "LUCKY CARD CHRISTMAS EDITION", 'price' => 150.00, 'barcode' => "LC-002", 'size' => 'none'],
            ],

            'NOVA SERIES' => [
                ['name' => "BERRIES NOVA",     'price' => 125.00, 'barcode' => "NS2", 'size' => 'L'],
                ['name' => "MANGO LEMON NOVA", 'price' => 125.00, 'barcode' => "NS3", 'size' => 'L'],
                ['name' => "LYCHEE LEM NOVA",  'price' => 125.00, 'barcode' => "NS1", 'size' => 'L'],
                ['name' => "STRAWBERRY NOVA",  'price' => 125.00, 'barcode' => "NS4", 'size' => 'L'],
                ['name' => "GREEN APPLE NOVA", 'price' => 125.00, 'barcode' => "NS5", 'size' => 'L'],
            ],

            'OKINAWA BROWN SUGAR' => [
                ['name' => "OKINAWA BROWN SUGAR",                 'price' => 109.00, 'barcode' => "OKM1", 'size' => 'M'],
                ['name' => "OKINAWA BROWN SUGAR",                 'price' => 129.00, 'barcode' => "OKL1", 'size' => 'L'],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE",        'price' => 119.00, 'barcode' => "OKM2", 'size' => 'M'],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE",        'price' => 139.00, 'barcode' => "OKL2", 'size' => 'L'],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE + MILO", 'price' => 129.00, 'barcode' => "OKM3", 'size' => 'M'],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE + MILO", 'price' => 149.00, 'barcode' => "OKL3", 'size' => 'L'],
            ],

            'PUMPKIN SPICE' => [
                ['name' => "PUMPKIN SPICE MILK TEA",      'price' => 145.00, 'barcode' => "PO1", 'size' => 'L'],
                ['name' => "PUMPKIN SPICE ICED COFFEE",   'price' => 165.00, 'barcode' => "PO4", 'size' => 'L'],
                ['name' => "PUMPKIN SPICE COFFEE FRAPPE", 'price' => 195.00, 'barcode' => "PO5", 'size' => 'L'],
            ],

            'ROCK SALT & CHEESE' => [
                ['name' => "VANILLA + ROCK SALT & CHEESE",        'price' => 115.00, 'barcode' => "RCM6", 'size' => 'M'],
                ['name' => "VANILLA + ROCK SALT & CHEESE",        'price' => 135.00, 'barcode' => "RCL6", 'size' => 'L'],
                ['name' => "DARK CHOCOLATE + ROCK SALT & CHEESE", 'price' => 115.00, 'barcode' => "RCM5", 'size' => 'M'],
                ['name' => "DARK CHOCOLATE + ROCK SALT & CHEESE", 'price' => 135.00, 'barcode' => "RCL5", 'size' => 'L'],
                ['name' => "WINTERMELON + ROCK SALT & CHEESE",    'price' => 115.00, 'barcode' => "RCM1", 'size' => 'M'],
                ['name' => "WINTERMELON + ROCK SALT & CHEESE",    'price' => 135.00, 'barcode' => "RCL1", 'size' => 'L'],
                ['name' => "MANGO + ROCK SALT & CHEESE",          'price' => 115.00, 'barcode' => "RCM2", 'size' => 'M'],
                ['name' => "MANGO + ROCK SALT & CHEESE",          'price' => 135.00, 'barcode' => "RCL2", 'size' => 'L'],
                ['name' => "AVOCADO + ROCK SALT & CHEESE",        'price' => 115.00, 'barcode' => "RCM3", 'size' => 'M'],
                ['name' => "AVOCADO + ROCK SALT & CHEESE",        'price' => 135.00, 'barcode' => "RCL3", 'size' => 'L'],
            ],

            'WAFFLE' => [
                ['name' => "WAFFLE BUTTER & HONEY",           'price' => 75.00,  'barcode' => "WFBT",      'size' => 'none'],
                ['name' => "WAFFLE STRAWBERRY CHEESECAKE",    'price' => 145.00, 'barcode' => "WFSTCK",    'size' => 'none'],
                ['name' => "WAFFLE BLUEBERRY CHEESECAKE",     'price' => 145.00, 'barcode' => "WFBBBRYCK", 'size' => 'none'],
                ['name' => "WAFFLE BLUEBERRY CREAM CHEESE",   'price' => 145.00, 'barcode' => "WFBBRCCH",  'size' => 'none'],
                ['name' => "WAFFLE STRAWBERRY CREAM CHEESE",  'price' => 145.00, 'barcode' => "WFSTRCCHS", 'size' => 'none'],
                ['name' => "WAFFLE CREAM CHEESE CHOCO CHIPS", 'price' => 145.00, 'barcode' => "WFFCCHP",   'size' => 'none'],
                ['name' => "WAFFLE CHEESECAKE CHOCO CHIPS",   'price' => 145.00, 'barcode' => "WFCHIPS",   'size' => 'none'],
                ['name' => "BFAST WAFFLE HAM",                'price' => 145.00, 'barcode' => "BFWHM",     'size' => 'none'],
                ['name' => "BFAST WAFFLE SPAM",               'price' => 155.00, 'barcode' => "BFWSPM",    'size' => 'none'],
                ['name' => "BFAST WAFFLE BACON",              'price' => 155.00, 'barcode' => "BFBCN",     'size' => 'none'],
                ['name' => "BFAST WAFFLE SAUSAGE",            'price' => 165.00, 'barcode' => "BFWSG",     'size' => 'none'],
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
                ['name' => "GREEN APPLE YAKULT", 'price' => 105.00, 'barcode' => "YSM1", 'size' => 'M'],
                ['name' => "GREEN APPLE YAKULT", 'price' => 125.00, 'barcode' => "YSL1", 'size' => 'L'],
                ['name' => "LYCHEE YAKULT",      'price' => 105.00, 'barcode' => "YSM3", 'size' => 'M'],
                ['name' => "LYCHEE YAKULT",      'price' => 125.00, 'barcode' => "YSL3", 'size' => 'L'],
                ['name' => "STRAWBERRY YAKULT",  'price' => 105.00, 'barcode' => "YSM2", 'size' => 'M'],
                ['name' => "STRAWBERRY YAKULT",  'price' => 125.00, 'barcode' => "YSL2", 'size' => 'L'],
                ['name' => "BLUEBERRY YAKULT",   'price' => 105.00, 'barcode' => "YSM6", 'size' => 'M'],
                ['name' => "BLUEBERRY YAKULT",   'price' => 125.00, 'barcode' => "YSL6", 'size' => 'L'],
                ['name' => "GREEN TEA YAKULT",   'price' => 105.00, 'barcode' => "YSM4", 'size' => 'M'],
                ['name' => "GREEN TEA YAKULT",   'price' => 125.00, 'barcode' => "YSL4", 'size' => 'L'],
                ['name' => "LEMON YAKULT",       'price' => 105.00, 'barcode' => "YSM5", 'size' => 'M'],
                ['name' => "LEMON YAKULT",       'price' => 125.00, 'barcode' => "YSL5", 'size' => 'L'],
                ['name' => "BERRIES YAKULT",     'price' => 105.00, 'barcode' => "YSM7", 'size' => 'M'],
                ['name' => "BERRIES YAKULT",     'price' => 125.00, 'barcode' => "YSL7", 'size' => 'L'],
            ],

            'YOGURT SERIES' => [
                ['name' => "YOGURT PLAIN",         'price' => 105.00, 'barcode' => "YGOP",    'size' => 'none'],
                ['name' => "YOGURT + STICKY RICE", 'price' => 125.00, 'barcode' => "YOGST",   'size' => 'none'],
                ['name' => "YOGURT BLUEBERRY",     'price' => 135.00, 'barcode' => "YOGBRY",  'size' => 'none'],
                ['name' => "YOGURT STRAWBERRY",    'price' => 135.00, 'barcode' => "YOGSTRY", 'size' => 'none'],
            ],
        ];

foreach ($menuData as $categoryName => $items) {
    $cupId = $categoryCupMap[$categoryName] ?? null;

    $category = Category::updateOrCreate(
        ['name' => $categoryName],
        ['cup_id' => $cupId]
    );

    // Build sub-category lookup for this category: size -> sub_category_id
    $subCategoryLookup = [];
    $category->subCategories()->each(function ($sub) use (&$subCategoryLookup) {
        $cleanName = trim($sub->name, '()');
        $subCategoryLookup[$cleanName] = $sub->id;
        $subCategoryLookup[$sub->name] = $sub->id;
    });

    // Cup code => size letter => sub-category name
    $cupSizeMap = [
        'SM/SL'   => ['M' => 'SM',  'L' => 'SL'],
        'JR'      => ['M' => 'JR',  'L' => 'JR'],
        'UM/UL'   => ['M' => 'UM',  'L' => 'UL'],
        'PCM/PCL' => ['M' => 'PCM', 'L' => 'PCL'],
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

        // Get the cup code for this category (e.g. 'SM/SL', 'JR', etc.)
        $cup = $cupId ? ($cupsById[$cupId] ?? null) : null;
        $cupCode = $cup?->code;
        $sizeMap = $cupSizeMap[$cupCode] ?? null;

        foreach ($items as $item) {
            $size = $item['size'];
            $subCatId = null;

            if ($sizeMap && isset($sizeMap[$size])) {
                // Drink with M/L — map to SM/SL, UM/UL, PCM/PCL, JR
                $subCatName = $sizeMap[$size];
                $subCatId = $subCatLookup[$category->id][$subCatName] ?? null;
            } elseif (!in_array($size, ['M', 'L', 'none'])) {
                // Piece sizes: 3pc, 4pc, 6pc, 12pc
                $subCatId = $subCatLookup[$category->id][$size] ?? null;
            }

            $category->menuItems()->updateOrCreate(
                ['barcode' => $item['barcode']],
                [
                    'name'            => $item['name'],
                    'price'           => $item['price'],
                    'cup_id'          => $cupId,
                    'size'            => $size,
                    'sub_category_id' => $subCatId,
                ]
            );
        }

        $this->command->info("Seeded: {$categoryName} (" . count($items) . " items)");
    }
}
    }

}