<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menuData = [
            'AFFORDA-BOWLS' => [
                ['name' => "AFFORD-SIOMAI + RICE", 'price' => 59.00, 'barcode' => 'AB-1'],
                ['name' => "AFFORD-HOTDOG + RICE", 'price' => 59.00, 'barcode' => 'AB-2'],
                ['name' => "AFFORD-CHIC WINGS + RICE", 'price' => 69.00, 'barcode' => 'AB-3'],
                ['name' => "AFFORD-CHIC POPPERS + RICE", 'price' => 69.00, 'barcode' => 'AB-4'],
                ['name' => "AFFORD-SHANGHAI + RICE", 'price' => 69.00, 'barcode' => 'AB-5'],
                ['name' => "AFFORD-CHICK TONKATSU + RICE", 'price' => 79.00, 'barcode' => 'AB-6'],
                ['name' => "AFFORD-LONGGA RICE + EGG", 'price' => 79.00, 'barcode' => 'AB-7'],
            ],
            
            'ALA CARTE SNACKS' => [
                ['name' => "Chicken Twister Wrap", 'price' => 85.00, 'barcode' => 'ACS-1'],
                ['name' => "Chicken Poppers Snack", 'price' => 99.00, 'barcode' => 'ACS-2'],
                ['name' => "Spaghetti", 'price' => 75.00, 'barcode' => 'ACS-3'],
                ['name' => "Thick Coated Fries", 'price' => 99.00, 'barcode' => 'ACS-4'],
                ['name' => "Cheesy Nachos", 'price' => 180.00, 'barcode' => 'ACS-5'],
                ['name' => "Bottled Mineral Water", 'price' => 25.00, 'barcode' => 'ACS-6'],
                ['name' => "Rice", 'price' => 20.00, 'barcode' => 'ACS-7'],
            ],
            
            'ALL DAY MEALS' => [
                ['name' => "SPICY TAPA ALL DAY MEAL", 'price' => 135.00, 'barcode' => 'ADM-1'],
                ['name' => "TONKATSU ALL DAY MEAL", 'price' => 120.00, 'barcode' => 'ADM-2'],
                ['name' => "3PCS CHICK WINGS ALL DAY MEAL", 'price' => 135.00, 'barcode' => 'ADM-3'],
                ['name' => "LONGGANISA ALL DAY MEAL", 'price' => 100.00, 'barcode' => 'ADM-4'],
                ['name' => "CHICKEN POPPERS ALL DAY MEAL", 'price' => 135.00, 'barcode' => 'ADM-5'],
            ],
            
            'CHEESECAKE MILK TEA' => [
                ['name' => "OKINAWA M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM1'],
                ['name' => "CHOC HZELNT + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM2'],
                ['name' => "STRAWBERRY M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM3'],
                ['name' => "SALTED CARAMEL M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM4'],
                ['name' => "VANILLA M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM5'],
                ['name' => "TARO M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM6'],
                ['name' => "MANGO M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM7'],
                ['name' => "BBERRY M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM8'],
                ['name' => "MATCHA M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM9'],
                ['name' => "COOKIES & CREAM M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM10'],
                ['name' => "BELGIAN M. TEA + C.CAKE", 'price' => 115.00, 'barcode' => 'CCMM11'],
            ],
            
            'CHICKEN WINGS' => [
                ['name' => "BUFFALO", 'price' => 0.00, 'barcode' => 'CW-1'],
                ['name' => "GARLIC PARMESAN", 'price' => 0.00, 'barcode' => 'CW-2'],
                ['name' => "SWEET CHILI", 'price' => 0.00, 'barcode' => 'CW-3'],
                ['name' => "TERIYAKI", 'price' => 0.00, 'barcode' => 'CW-4'],
                ['name' => "SOY GARLIC", 'price' => 0.00, 'barcode' => 'CW-5'],
                ['name' => "SALTED EGG", 'price' => 0.00, 'barcode' => 'CW-6'],
            ],
            
            'CLASSIC MILKTEA' => [
                ['name' => "CLASSIC M. TEA", 'price' => 70.00, 'barcode' => 'CMM1'],
                ['name' => "CLASSIC PEARL M. TEA", 'price' => 70.00, 'barcode' => 'CMM2'],
                ['name' => "CLASSIC BUDDY M. TEA", 'price' => 105.00, 'barcode' => 'CMM3'],
                ['name' => "CLASSIC DUO M. TEA", 'price' => 115.00, 'barcode' => 'CMM4'],
                ['name' => "CLASSIC CRM. CHEESE", 'price' => 115.00, 'barcode' => 'CMM5'],
                ['name' => "CLASSIC C. CAKE M. TEA", 'price' => 115.00, 'barcode' => 'CMM6'],
                ['name' => "CLASSIC RSC M. TEA", 'price' => 115.00, 'barcode' => 'CMM7'],
                ['name' => "CLASSIC M. TEA + OREO", 'price' => 85.00, 'barcode' => 'CMM8'],
                ['name' => "CLASSIC M. TEA + PUDDING", 'price' => 95.00, 'barcode' => 'CMM9'],
                ['name' => "CL PUDDING + B.PEARL", 'price' => 110.00, 'barcode' => 'CMM10'],
                ['name' => "CL PUDDING + MWP", 'price' => 110.00, 'barcode' => 'CMM11'],
            ],
            
            'COFFEE FRAPPE' => [
                ['name' => "MOCHA FRP", 'price' => 125.00, 'barcode' => 'CFM1'],
                ['name' => "VANILLA FRP", 'price' => 125.00, 'barcode' => 'CFM2'],
                ['name' => "JAVA CHIP FRP", 'price' => 125.00, 'barcode' => 'CFM3'],
                ['name' => "TOFFEE CARAMEL FRP", 'price' => 125.00, 'barcode' => 'CFM4'],
                ['name' => "CARAMEL MACCHIATO FRP", 'price' => 125.00, 'barcode' => 'CFM5'],
            ],
            
            'COMBO MEALS' => [
                ['name' => "THICK COATED FRIES & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM2'],
                ['name' => "CHICKEN TWISTER & CLASSIC PEARL", 'price' => 164.00, 'barcode' => 'COM4'],
                ['name' => "SPAGHETTI & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM6'],
                ['name' => "3PC CHICK WINGS & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM8'],
                ['name' => "CHEESY NACHOS & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM10'],
                ['name' => "CHICKEN POPPERS & CLASSIC PEARL", 'price' => 174.00, 'barcode' => 'COM12'],
            ],

            'CREAM CHEESE M. TEA' => [
                ['name' => "BELGIAN CHOCO M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM1"],
                ['name' => "RED VELVET M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM2"],
                ['name' => "HERSHEYS M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM3"],
                ['name' => "SALTED CARAMEL M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM4"],
                ['name' => "VANILLA M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM5"],
                ['name' => "OKINAWA M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM6"],
                ['name' => "TARO M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM7"],
                ['name' => "MATCHA M.TEA + CRM CHEESE", 'price' => 115.00, 'barcode' => "CRMM8"],
                ['name' => "CHOCO HAZELNUT + CRM CHEESE", 'price' => 115.00, 'barcode' => "CHCML4"],
                ['name' => "BLUEBERRY + CRM CHEESE", 'price' => 115.00, 'barcode' => "BBCC2"],
            ],
            'FLAVORED MILK TEA' => [
                ['name' => "MATCHA M.TEA", 'price' => 85.00, 'barcode' => "FLMM1"],
                ['name' => "TARO M.TEA", 'price' => 85.00, 'barcode' => "FLMM2"],
                ['name' => "SALTED CARAMEL M.TEA", 'price' => 85.00, 'barcode' => "FLMM3"],
                ['name' => "WINTERMELON M.TEA", 'price' => 85.00, 'barcode' => "FLMM4"],
                ['name' => "JAVA CHIP M.TEA", 'price' => 85.00, 'barcode' => "FLMM5"],
                ['name' => "OKINAWA M.TEA", 'price' => 85.00, 'barcode' => "FLMM6"],
                ['name' => "VANILLA M.TEA", 'price' => 85.00, 'barcode' => "FLMM7"],
                ['name' => "HERSHEY'S M.TEA", 'price' => 85.00, 'barcode' => "FLMM8"],
                ['name' => "MOCHA M.TEA", 'price' => 85.00, 'barcode' => "FLMM9"],
                ['name' => "BELGIAN M.TEA", 'price' => 85.00, 'barcode' => "FLMM10"],
                ['name' => "MANGO M.TEA", 'price' => 85.00, 'barcode' => "FLMM11"],
                ['name' => "AVOCADO M.TEA", 'price' => 85.00, 'barcode' => "FLMM12"],
                ['name' => "RED VELVET M.TEA", 'price' => 85.00, 'barcode' => "FLMM13"],
                ['name' => "CARAMEL MACCH M.TEA", 'price' => 85.00, 'barcode' => "FLMM14"],
                ['name' => "COOKIES & CREAM M.TEA", 'price' => 85.00, 'barcode' => "FLMM15"],
                ['name' => "STRAWBERRY M.TEA", 'price' => 85.00, 'barcode' => "FLMM16"],
                ['name' => "BLUEBERRY M.TEA", 'price' => 85.00, 'barcode' => "FLMM17"],
                ['name' => "DARK CHOCOLATE M.TEA", 'price' => 85.00, 'barcode' => "FLMM18"],
                ['name' => "CHOCO HAZELNUT M.TEA", 'price' => 85.00, 'barcode' => "FLMM19"],
                ['name' => "TOFFEE CARAMEL M.TEA", 'price' => 85.00, 'barcode' => "FLMM20"],
            ],
            'FP COFFEE BUNDLES' => [
                ['name' => "TOF.CARAMEL ICED COFFEE(L) + DK ROAST COFFEE", 'price' => 154.00, 'barcode' => "COF1"],
                ['name' => "VANILLA ICED COFFEE + J.CHIP COFEE FRP", 'price' => 250.00, 'barcode' => "COF2"],
            ],
            'FRAPPE SERIES' => [
                ['name' => "TARO FRAPPE", 'price' => 110.00, 'barcode' => "FSM1"],
                ['name' => "RED VELVET FRAPPE", 'price' => 110.00, 'barcode' => "FSM3"],
                ['name' => "CHOCO. HAZELNUT FRAPPE", 'price' => 110.00, 'barcode' => "FSM5"],
                ['name' => "SALTED CARAMEL FRAPPE", 'price' => 110.00, 'barcode' => "FSM6"],
                ['name' => "DARK CHOCOLATE FRAPPE", 'price' => 110.00, 'barcode' => "FSM7"],
                ['name' => "COOKIES & CREAM FRAPPE", 'price' => 110.00, 'barcode' => "FSM8"],
                ['name' => "BELGIAN CHOCO. FRAPPE", 'price' => 110.00, 'barcode' => "FSL2"],
                ['name' => "HERSHEYS FRAPPE", 'price' => 110.00, 'barcode' => "HS2"],
            ],
            'FREEBIES' => [
                ['name' => "FREE TOTE BAG", 'price' => 0.00, 'barcode' => "TB1f"],
                ['name' => "TUMBLER", 'price' => 0.00, 'barcode' => "TMB1"],
                ['name' => "FLOWER", 'price' => 0.00, 'barcode' => "FL1"],
                ['name' => "FREE MUG", 'price' => 0.00, 'barcode' => "FRMG"],
            ],
            'FRUIT SODA SERIES' => [
                ['name' => "BLUEBERRY FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS1"],
                ['name' => "BERRIES FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS2"],
                ['name' => "LYCHEE FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS3"],
                ['name' => "LEMON FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS4"],
                ['name' => "GREEN APPLE FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS5"],
                ['name' => "STRAWBERRY FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS6"],
                ['name' => "PASSION FRUIT SODA (L)", 'price' => 125.00, 'barcode' => "FS7"],
            ],
            'GF DUO BUNDLES' => [
                ['name' => "SWEETY -L (WMELON M.TEA + DARK CHOCOLATE RSC)", 'price' => 245.00, 'barcode' => "GF1"],
                ['name' => "CHEESY PARTNER -L (HERSHEY'S CHOCO CRMCHEESE + CL C.CAKE MTEA)", 'price' => 270.00, 'barcode' => "GF2"],
                ['name' => "PERFECT MATCH -L (WMELON RSC + CL PEARL MILK TEA", 'price' => 240.00, 'barcode' => "GF3"],
                ['name' => "COUPLE'S CHOICE -L (BELGIAN CHOCO CRM. CHEESE + CL PEARL M.TEA", 'price' => 240.00, 'barcode' => "GF4"],
            ],
            'FP/GF FET2 CLASSIC' => [
                ['name' => "2 CL PEARL M.TEA", 'price' => 210.00, 'barcode' => "2M"],
                ['name' => "2 CL BUDDY", 'price' => 210.00, 'barcode' => "1M"],
                ['name' => "2 CL PUDDING M.TEA", 'price' => 230.00, 'barcode' => "GC3"],
                ['name' => "2 CLASSICS RSC", 'price' => 270.00, 'barcode' => "GC2"],
            ],
            'GRAND OPENING PROMO' => [
                ['name' => "BOGO", 'price' => 85.00, 'barcode' => "B1G1M"],
            ],
            'GREEN TEA SERIES' => [
                ['name' => "PASSION FRUIT GREEN TEA", 'price' => 105.00, 'barcode' => "FTSM1"],
                ['name' => "LEMON CHIA GREEN TEA", 'price' => 105.00, 'barcode' => "FTSM2"],
                ['name' => "HONEY LEMON GREEN TEA", 'price' => 105.00, 'barcode' => "FTSM3"],
                ['name' => "WINTERMELON GREEN TEA", 'price' => 105.00, 'barcode' => "FTSM4"],
                ['name' => "LEMON CUCUMBER GREEN TEA", 'price' => 55.00, 'barcode' => "FTSM5"],
                ['name' => "LYCHEE GREEN TEA", 'price' => 55.00, 'barcode' => "FTSM6"],
            ],
            'HOT COFFEE' => [
                ['name' => "DARK ROAST COFFEE", 'price' => 49.00, 'barcode' => "HFM1"],
                ['name' => "HOT CARAMEL MACCHO COFFEE", 'price' => 55.00, 'barcode' => "HFM2"],
                ['name' => "HOT MOCHA COFFEE", 'price' => 55.00, 'barcode' => "HFM3"],
            ],
            'HOT DRINKS' => [
                ['name' => "HOT CHOCOLATE", 'price' => 55.00, 'barcode' => "HDM1"],
                ['name' => "HOT RED VELVET", 'price' => 85.00, 'barcode' => "HDM2"],
                ['name' => "HOT MATCHA", 'price' => 55.00, 'barcode' => "HDM3"],
            ],
            'ICED COFFEE' => [
                ['name' => "ICED COFFEE", 'price' => 85.00, 'barcode' => "ICM1"],
                ['name' => "ICED VANILLA COFFEE", 'price' => 85.00, 'barcode' => "ICM2"],
                ['name' => "ICED MOCHA COFFEE", 'price' => 85.00, 'barcode' => "ICM3"],
                ['name' => "ICED TOF CARAMEL COFFEE", 'price' => 85.00, 'barcode' => "ICM4"],
                ['name' => "ICED JAVA CHIP COFFEE", 'price' => 85.00, 'barcode' => "ICM5"],
                ['name' => "ICED CARAMEL MACCH COFFEE", 'price' => 85.00, 'barcode' => "ICM6"],
            ],
            'CARD' => [
                ['name' => "LUCKY CARD", 'price' => 150.00, 'barcode' => "LC-001"],
                ['name' => "LUCKY CARD CHRISTMAS EDITION", 'price' => 150.00, 'barcode' => "LC-002"],
            ],
            'NOVA SERIES' => [
                ['name' => "LYCHEE LEM NOVA (L)", 'price' => 125.00, 'barcode' => "NS1"],
                ['name' => "BERRIES NOVA (L)", 'price' => 125.00, 'barcode' => "NS2"],
                ['name' => "MANGO LEMON NOVA (L)", 'price' => 125.00, 'barcode' => "NS3"],
                ['name' => "STRAWBERRY NOVA (L)", 'price' => 125.00, 'barcode' => "NS4"],
                ['name' => "GREEN APPLE NOVA (L)", 'price' => 125.00, 'barcode' => "NS5"],
            ],
            'OKINAWA BROWN SUGAR' => [
                ['name' => "OKINAWA BROWN SUGAR", 'price' => 109.00, 'barcode' => "OKM1"],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE", 'price' => 119.00, 'barcode' => "OKM2"],
                ['name' => "OK BROWN SUGAR CHEESE MOUSSE + MILO", 'price' => 129.00, 'barcode' => "OKM3"],
            ],
            'PROMOS' => [
                ['name' => "STUDENT FREE UPSIZE", 'price' => 0.00, 'barcode' => "STFUPZ"],
                ['name' => "10% EMPLOYEE DISCOUNT", 'price' => 0.00, 'barcode' => "EMPDSC"],
                ['name' => "GROCERY TIE UP -FREE UPSIZE", 'price' => 0.00, 'barcode' => "GCTP"],
                ['name' => "LOYALTY CARD CLAIM", 'price' => 0.00, 'barcode' => "LCCCM"],
                ['name' => "LUCKY CARD CLAIM -BOGO", 'price' => 0.00, 'barcode' => "LCBG"],
                ['name' => "LUCKY CARD CLAIM -10%", 'price' => 0.00, 'barcode' => "LC10"],
                ['name' => "FREE LARGE DRINK", 'price' => 0.00, 'barcode' => "FLDR"],
                ['name' => "FREE MEDIUM DRINK", 'price' => 0.00, 'barcode' => "FLMD"],
                ['name' => "FREE BLACK PEARL", 'price' => 0.00, 'barcode' => "FBPRL"],
                ['name' => "FREE LUCKY CARD", 'price' => 0.00, 'barcode' => "FLLCKYC"],
                ['name' => "FREE DELIVERY", 'price' => 0.00, 'barcode' => "FRDY"],
            ],
            'PUMPKIN SPICE' => [
                ['name' => "PS MILK TEA (L)", 'price' => 145.00, 'barcode' => "PO1"],
                ['name' => "PS ICED COFFEE (L)", 'price' => 165.00, 'barcode' => "PO4"],
                ['name' => "PS COFFEE FRAPPE (L)", 'price' => 195.00, 'barcode' => "PO5"],
            ],
            'ROCK SALT & CHEESE' => [
                ['name' => "WMELON M.TEA + RSC", 'price' => 115.00, 'barcode' => "RCM1"],
                ['name' => "MANGO M.TEA + RSC", 'price' => 115.00, 'barcode' => "RCM2"],
                ['name' => "AVOCADO M.TEA + RSC", 'price' => 115.00, 'barcode' => "RCM3"],
                ['name' => "SALTED CARAMEL M.TEA + RSC", 'price' => 115.00, 'barcode' => "RCM4"],
                ['name' => "DARK CHOCOLATE M.TEA + RSC", 'price' => 115.00, 'barcode' => "RCM5"],
                ['name' => "VANILLA M.TEA + RSC", 'price' => 115.00, 'barcode' => "RCM6"],
            ],
            'WAFFLE' => [
                ['name' => "WAFFLE BUTTER & HONEY", 'price' => 75.00, 'barcode' => "WFBT"],
                ['name' => "WAFFLE STRAWBERRY CHEESECAKE", 'price' => 145.00, 'barcode' => "WFSTCK"],
                ['name' => "WAFFLE BLUEBERRY CHEESECAKE", 'price' => 145.00, 'barcode' => "WFBBBRYCK"],
                ['name' => "WAFFLE BLUEBERRY CREAM CHEESE", 'price' => 145.00, 'barcode' => "WFBBRCCH"],
                ['name' => "WAFFLE STRAWBERRY CREAM CHEESE", 'price' => 145.00, 'barcode' => "WFSTRCCHS"],
                ['name' => "WAFFLE CREAM CHEESE CHOCO CHIPS", 'price' => 145.00, 'barcode' => "WFFCCHP"],
                ['name' => "WAFFLE CHEESECAKE CHOCO CHIPS", 'price' => 145.00, 'barcode' => "WFCHIPS"],
                ['name' => "BFAST WAFFLE HAM", 'price' => 145.00, 'barcode' => "BFWHM"],
                ['name' => "BFAST WAFFLE SPAM", 'price' => 145.00, 'barcode' => "BFWSPM"],
                ['name' => "BFAST WAFFLE BACON", 'price' => 145.00, 'barcode' => "BFBCN"],
                ['name' => "BFAST WAFFLE SAUSAGE", 'price' => 145.00, 'barcode' => "BFWSG"],
                ['name' => "WAFFLE WHIP CREAM CHOCO CHIPS", 'price' => 105.00, 'barcode' => "WFWHP"],
                ['name' => "WAFFLE WHIP CREAM STRAWBERRY", 'price' => 105.00, 'barcode' => "WFWHSTRW"],
                ['name' => "WAFFLE WHIP CREAM BLUEBERRY", 'price' => 105.00, 'barcode' => "WFCBRY"],
            ],
            'YAKULT SERIES' => [
                ['name' => "Green Apple Yakult", 'price' => 105.00, 'barcode' => "YSM1"],
                ['name' => "Strawberry Yakult", 'price' => 105.00, 'barcode' => "YSM2"],
                ['name' => "Lychee Yakult", 'price' => 105.00, 'barcode' => "YSM3"],
                ['name' => "Green Tea Yakult", 'price' => 105.00, 'barcode' => "YSM4"],
                ['name' => "Lemon Yakult", 'price' => 105.00, 'barcode' => "YSM5"],
                ['name' => "Blueberry Yakult", 'price' => 105.00, 'barcode' => "YSM6"],
                ['name' => "Berries Yakult", 'price' => 105.00, 'barcode' => "YSM7"],
            ],
            'YOGURT SERIES' => [
                ['name' => "YOGURT PLAIN", 'price' => 105.00, 'barcode' => "YGOP"],
                ['name' => "YOGURT + STICKY RICE", 'price' => 125.00, 'barcode' => "YOGST"],
                ['name' => "YOGURT BLUEBERRY", 'price' => 135.00, 'barcode' => "YOGBRY"],
                ['name' => "YOGURT STRAWBERRY", 'price' => 135.00, 'barcode' => "YOGSTRY"],
            ],
        ];

        foreach ($menuData as $categoryName => $items) {
            $category = Category::updateOrCreate(
                ['name' => $categoryName],
                ['type' => $this->determineType($categoryName)]
            );

            foreach ($items as $item) {
                $category->menuItems()->updateOrCreate(
                    ['barcode' => $item['barcode']],
                    [
                        'name' => $item['name'],
                        'price' => $item['price']
                    ]
                );
            }
        }
    }

    private function determineType($name) {
        $name = strtoupper($name);
        $drinkKeywords = ['MILKTEA', 'MILK TEA', 'COFFEE', 'DRINKS', 'TEA', 'SODA', 'YOGURT', 'YAKULT', 'NOVA', 'FRAPPE', 'BROWN SUGAR'];
        
        foreach ($drinkKeywords as $key) {
            if (str_contains($name, $key)) return 'drink';
        }
        
        if (str_contains($name, 'WINGS')) return 'wings';
        return 'standard';
    }
}