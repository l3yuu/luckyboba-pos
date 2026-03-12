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
                'name'         => 'TOFFEE CARAMEL ICED COFFEE + DARK ROAST COFFEE',
                'display_name' => null,
                'category'     => 'FP COFFEE BUNDLES',
                'barcode'      => 'COF1',
                'price'        => 154.00,
                'size'         => 'L',
                'cup_id'       => $umul,
                'items'        => [
                    ['custom_name' => 'TOFFEE CARAMEL ICED COFFEE', 'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'DARK ROAST COFFEE',           'quantity' => 1, 'size' => 'L'],
                ],
            ],
            [
                'name'         => 'VANILLA ICED COFFEE + JAVA CHIP COFFEE FRP',
                'display_name' => null,
                'category'     => 'FP COFFEE BUNDLES',
                'barcode'      => 'COF2',
                'price'        => 250.00,
                'size'         => 'L',
                'cup_id'       => $umul,
                'items'        => [
                    ['custom_name' => 'VANILLA ICED COFFEE',    'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'JAVA CHIP COFFEE FRAPPE', 'quantity' => 1, 'size' => 'L'],
                ],
            ],

            // ── FP/GF FET2 CLASSIC (SM/SL cup) ────────────────────────────
            [
                'name'         => '2 CL PEARL M.TEA',
                'display_name' => null,
                'category'     => 'FP/GF FET2 CLASSIC',
                'barcode'      => '2M',
                'price'        => 210.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'CLASSIC PEARL MILK TEA', 'quantity' => 2, 'size' => 'L'],
                ],
            ],
            [
                'name'         => '2 CL BUDDY',
                'display_name' => null,
                'category'     => 'FP/GF FET2 CLASSIC',
                'barcode'      => '1M',
                'price'        => 210.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'CLASSIC BUDDY', 'quantity' => 2, 'size' => 'L'],
                ],
            ],
            [
                'name'         => '2 CL PUDDING M.TEA',
                'display_name' => null,
                'category'     => 'FP/GF FET2 CLASSIC',
                'barcode'      => 'GC3',
                'price'        => 230.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'CLASSIC PUDDING MILK TEA', 'quantity' => 2, 'size' => 'L'],
                ],
            ],
            [
                'name'         => '2 CLASSICS RSC',
                'display_name' => null,
                'category'     => 'FP/GF FET2 CLASSIC',
                'barcode'      => 'GC2',
                'price'        => 270.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'CLASSIC ROCK SALT & CHEESE', 'quantity' => 2, 'size' => 'L'],
                ],
            ],

            // ── GF DUO BUNDLES (SM/SL cup) ────────────────────────────────
            [
                'name'         => 'SWEETY',
                'display_name' => 'SWEETY (WINTERMELON M.TEA + DARK CHOCOLATE RSC)',
                'category'     => 'GF DUO BUNDLES',
                'barcode'      => 'GF1',
                'price'        => 245.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'WINTERMELON MILK TEA',          'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'DARK CHOCOLATE ROCK SALT CHEESE', 'quantity' => 1, 'size' => 'L'],
                ],
            ],
            [
                'name'         => 'CHEESY PARTNER',
                'display_name' => "CHEESY PARTNER (HERSHEY'S CHOCO CRMCHEESE + CL C.CAKE MTEA)",
                'category'     => 'GF DUO BUNDLES',
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
                'barcode'      => 'GF4',
                'price'        => 240.00,
                'size'         => 'L',
                'cup_id'       => $smsl,
                'items'        => [
                    ['custom_name' => 'BELGIAN CHOCO CREAM CHEESE', 'quantity' => 1, 'size' => 'L'],
                    ['custom_name' => 'CLASSIC PEARL MILK TEA',     'quantity' => 1, 'size' => 'L'],
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

            // Remove old items then re-seed (safe for re-runs)
            $bundle->items()->delete();

            foreach ($items as $item) {
                $bundle->items()->create($item);
            }

            $this->command->info("Seeded bundle: {$bundle->name} (" . count($items) . " items)");
        }
    }
}