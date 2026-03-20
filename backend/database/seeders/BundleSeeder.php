<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bundle;
use App\Models\Cup;

class BundleSeeder extends Seeder
{
    public function run(): void
    {
        $umul = Cup::where('code', 'UM/UL')->first()?->id;
        $smsl = Cup::where('code', 'SM/SL')->first()?->id;

        $bundles = [

            // ── FP COFFEE BUNDLES (UM/UL cup) ─────────────────────────────
            [
                'name'        => 'TOFFEE CARAMEL ICED COFFEE + DARK ROAST COFFEE',
                'category'    => 'FP COFFEE BUNDLES',
                'bundle_type' => 'bundle',
                'barcode'     => 'COF1',
                'price'       => 154.00,
                'size'        => 'L',
                'cup_id'      => $umul,
                'items'       => [
                    ['custom_name' => 'TOFFEE CARAMEL ICED COFFEE', 'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'DARK ROAST COFFEE',           'quantity' => 1, 'size' => 'L'],
                ],
            ],
            [
                'name'        => 'VANILLA ICED COFFEE + JAVA CHIP COFFEE FRP',
                'category'    => 'FP COFFEE BUNDLES',
                'bundle_type' => 'bundle',
                'barcode'     => 'COF2',
                'price'       => 250.00,
                'size'        => 'L',
                'cup_id'      => $umul,
                'items'       => [
                    ['custom_name' => 'VANILLA ICED COFFEE',     'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'JAVA CHIP COFFEE FRAPPE', 'quantity' => 1, 'size' => 'L'],
                ],
            ],

            // ── FP/GF FET2 CLASSIC (SM/SL cup) ────────────────────────────
            [
                'name'        => '2 CL PEARL M.TEA',
                'category'    => 'FP/GF FET2 CLASSIC',
                'bundle_type' => 'bundle',
                'barcode'     => '2M',
                'price'       => 210.00,
                'size'        => 'L',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CLASSIC PEARL MILK TEA', 'quantity' => 2, 'size' => 'L'],
                ],
            ],
            [
                'name'        => '2 CL BUDDY',
                'category'    => 'FP/GF FET2 CLASSIC',
                'bundle_type' => 'bundle',
                'barcode'     => '1M',
                'price'       => 210.00,
                'size'        => 'L',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CLASSIC BUDDY', 'quantity' => 2, 'size' => 'L'],
                ],
            ],
            [
                'name'        => '2 CL PUDDING M.TEA',
                'category'    => 'FP/GF FET2 CLASSIC',
                'bundle_type' => 'bundle',
                'barcode'     => 'GC3',
                'price'       => 230.00,
                'size'        => 'L',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CLASSIC PUDDING MILK TEA', 'quantity' => 2, 'size' => 'L'],
                ],
            ],
            [
                'name'        => '2 CLASSICS RSC',
                'category'    => 'FP/GF FET2 CLASSIC',
                'bundle_type' => 'bundle',
                'barcode'     => 'GC2',
                'price'       => 270.00,
                'size'        => 'L',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CLASSIC ROCK SALT & CHEESE', 'quantity' => 2, 'size' => 'L'],
                ],
            ],

            // ── GF DUO BUNDLES (SM/SL cup) ────────────────────────────────
            [
                'name'         => 'SWEETY',
                'display_name' => 'SWEETY (WINTERMELON M.TEA + DARK CHOCOLATE RSC)',
                'category'     => 'GF DUO BUNDLES',
                'bundle_type'  => 'bundle',
                'barcode'      => 'GF1',
                'price'        => 245.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'WINTERMELON MILK TEA',           'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'DARK CHOCOLATE ROCK SALT CHEESE', 'quantity' => 1, 'size' => 'L'],
                ],
            ],
            [
                'name'         => 'CHEESY PARTNER',
                'display_name' => "CHEESY PARTNER (HERSHEY'S CHOCO CRMCHEESE + CL C.CAKE MTEA)",
                'category'     => 'GF DUO BUNDLES',
                'bundle_type'  => 'bundle',
                'barcode'      => 'GF2',
                'price'        => 270.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => "HERSHEY'S CHOCO CREAM CHEESE", 'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'CLASSIC CHEESECAKE MILK TEA',  'quantity' => 1, 'size' => 'L'],
                ],
            ],
            [
                'name'         => 'PERFECT MATCH',
                'display_name' => 'PERFECT MATCH (WMELON RSC + CL PEARL MILK TEA)',
                'category'     => 'GF DUO BUNDLES',
                'bundle_type'  => 'bundle',
                'barcode'      => 'GF3',
                'price'        => 240.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'WINTERMELON ROCK SALT CHEESE', 'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'CLASSIC PEARL MILK TEA',       'quantity' => 1, 'size' => 'L'],
                ],
            ],
            [
                'name'         => "COUPLE'S CHOICE",
                'display_name' => "COUPLE'S CHOICE (BELGIAN CHOCO CRM. CHEESE + CL PEARL M.TEA)",
                'category'     => 'GF DUO BUNDLES',
                'bundle_type'  => 'bundle',
                'barcode'      => 'GF4',
                'price'        => 240.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'BELGIAN CHOCO CREAM CHEESE', 'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'CLASSIC PEARL MILK TEA',     'quantity' => 1, 'size' => 'L'],
                ],
            ],

            // ── COMBO MEALS ───────────────────────────────────────────────
            [
                'name'        => 'THICK COATED FRIES & CLASSIC PEARL',
                'category'    => 'COMBO MEALS',
                'bundle_type' => 'combo',
                'barcode'     => 'COM2',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'THICK COATED FRIES', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL',       'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'CHICKEN TWISTER & CLASSIC PEARL',
                'category'    => 'COMBO MEALS',
                'bundle_type' => 'combo',
                'barcode'     => 'COM4',
                'price'       => 164.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CHICKEN TWISTER WRAP', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL',         'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'SPAGHETTI & CLASSIC PEARL',
                'category'    => 'COMBO MEALS',
                'bundle_type' => 'combo',
                'barcode'     => 'COM6',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'SPAGHETTI',     'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => '3PC CHICK WINGS & CLASSIC PEARL',
                'category'    => 'COMBO MEALS',
                'bundle_type' => 'combo',
                'barcode'     => 'COM8',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => '3PC CHICKEN WINGS', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL',      'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'CHEESY NACHOS & CLASSIC PEARL',
                'category'    => 'COMBO MEALS',
                'bundle_type' => 'combo',
                'barcode'     => 'COM10',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CHEESY NACHOS',  'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL',  'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'CHICKEN POPPERS & CLASSIC PEARL',
                'category'    => 'COMBO MEALS',
                'bundle_type' => 'combo',
                'barcode'     => 'COM12',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CHICKEN POPPERS', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL',   'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],

            // ── PIZZA PEDRICOS COMBO ──────────────────────────────────────
            [
                'name'        => 'PIZZA + CLASSIC PEARL',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-CP1',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',         'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'CLASSIC PEARL', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + ICED COFFEE CLASSIC',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-IC1',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',               'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'ICED COFFEE CLASSIC', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + ICED MOCHA COFFEE',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-IC2',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',             'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'ICED MOCHA COFFEE', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + ICED JAVA CHIP COFFEE',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-IC3',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',                 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'ICED JAVA CHIP COFFEE', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + ICED TOFFEE CARAMEL',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-IC4',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',              'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'ICED TOFFEE CARAMEL','quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + ICED CARAMEL MACCHIATO',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-IC5',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',                  'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'ICED CARAMEL MACCHIATO', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + COOKIES & CREAM MILK TEA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-FM1',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',                    'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'COOKIES & CREAM MILK TEA', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + STRAWBERRY MILK TEA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-FM2',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',              'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'STRAWBERRY MILK TEA','quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + MANGO MILK TEA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-FM3',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',          'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'MANGO MILK TEA', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + AVOCADO MILK TEA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-FM4',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',            'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'AVOCADO MILK TEA', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + BELGIAN MILK TEA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-FM5',
                'price'       => 174.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',            'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'BELGIAN MILK TEA', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + GREEN APPLE YAKULT',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-YK1',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',              'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'GREEN APPLE YAKULT', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + LYCHEE YAKULT',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-YK2',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',         'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'LYCHEE YAKULT', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + BLUEBERRY YAKULT',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-YK3',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',            'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'BLUEBERRY YAKULT', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + LEMON YAKULT',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-YK4',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',         'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'LEMON YAKULT',  'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + BERRIES YAKULT',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-YK5',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',          'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'BERRIES YAKULT', 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + BERRIES NOVA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-NV1',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',        'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'BERRIES NOVA', 'quantity' => 1, 'size' => 'L',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + MANGO LEMON NOVA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-NV2',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',            'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'MANGO LEMON NOVA', 'quantity' => 1, 'size' => 'L',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + LYCHEE LEM NOVA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-NV3',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',          'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'LYCHEE LEM NOVA','quantity' => 1, 'size' => 'L',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + STRAWBERRY NOVA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-NV4',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',            'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'STRAWBERRY NOVA',  'quantity' => 1, 'size' => 'L',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'PIZZA + GREEN APPLE NOVA',
                'category'    => 'PIZZA PEDRICOS COMBO',
                'bundle_type' => 'combo',
                'barcode'     => 'PPC-NV5',
                'price'       => 194.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'PIZZA',             'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'GREEN APPLE NOVA',  'quantity' => 1, 'size' => 'L',    'display_name' => 'Drink'],
                ],
            ],
            // ── MIX & MATCH (₱105 meals) ──────────────────────────────────────────
            [
                'name'        => 'SPAGHETTI W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-SP',
                'price'       => 105.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'SPAGHETTI W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',              'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'SIOMAI W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-SM',
                'price'       => 105.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'SIOMAI W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',           'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'HOTDOG W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-HD',
                'price'       => 105.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'HOTDOG W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',           'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],

            // ── MIX & MATCH (₱125 meals) ──────────────────────────────────────────
            [
                'name'        => 'CHICKEN POPPERS W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-CP',
                'price'       => 125.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CHICKEN POPPERS W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',                    'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'SHANGHAI W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-SH',
                'price'       => 125.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'SHANGHAI W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',             'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'CHICKEN WINGS W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-CW',
                'price'       => 125.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CHICKEN WINGS W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',                  'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],

            // ── MIX & MATCH (₱150 meals) ──────────────────────────────────────────
            [
                'name'        => 'TONKATSU W/ RICE + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-TK',
                'price'       => 150.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'TONKATSU W/ RICE', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',             'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'CHICKEN TWISTER WRAP + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-CTW',
                'price'       => 150.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'CHICKEN TWISTER WRAP', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',                 'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
            [
                'name'        => 'THICK COATED FRIES + DRINK',
                'category'    => 'MIX & MATCH',
                'bundle_type' => 'mix_and_match',
                'barcode'     => 'MM-TCF',
                'price'       => 150.00,
                'size'        => 'none',
                'cup_id'      => $smsl,
                'items'       => [
                    ['custom_name' => 'THICK COATED FRIES', 'quantity' => 1, 'size' => 'none', 'display_name' => 'Food'],
                    ['custom_name' => 'DRINK',               'quantity' => 1, 'size' => 'M',    'display_name' => 'Drink'],
                ],
            ],
        ];

        foreach ($bundles as $bundleData) {
            $items = $bundleData['items'];
            unset($bundleData['items']);

            $bundle = Bundle::updateOrCreate(
                ['barcode' => $bundleData['barcode']],
                $bundleData
            );

            $bundle->items()->delete();

            foreach ($items as $item) {
                $bundle->items()->create($item);
            }

            $this->command->info("Seeded bundle: {$bundle->name} (" . count($items) . " items)");
        }
    }
}