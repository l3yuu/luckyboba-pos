<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuItemOptionSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('menu_item_options')->truncate();

        // ── PEARL + ICE ───────────────────────────────────────────────────
        $pearlAndIce = [
            // ICED COFFEE
            'ICM1','ICL1','ICM3','ICL3','ICM2','ICL2',
            'ICM5','ICL5','ICM4','ICL4','ICM6','ICL6',
            // FLAVORED MILK TEA
            'FLMM4','FLML4','FLMM13','FLML13','FLMM12','FLML12',
            'FLMM11','FLML11','FLMM2','FLML2','FLMM10','FLML10',
            'FLMM8','FLML8','FLMM3','FLML3','FLMM19','FLML19',
            'FLMM15','FLML15','FLMM20','FLML20','FLMM7','FLML7',
            'FLMM17','FLML17','FLMM6','FLML6','FLMM9','FLML9',
            'FLMM5','FLML5','FLMM1','FLML1','FLMM16','FLML16','FLMM18','FLML18','FLMM30','FLML30',
            // FRAPPE SERIES
            'FSM1','FSL1','FSM7','FSL7','FSM8','FSL8','FSM3','FSL3',
            'FSM4','FSL4','FSM5','FSL5','FSM6','FSL6','FSM2','FSL2',
            // COFFEE FRAPPE
            'CFM1','CFL1','CFM2','CFL2','CFM3','CFL3','CFM4','CFL4','CFM5','CFL5',
            // NOVA SERIES
            'NS2','NS3','NS1','NS4','NS5',
            // CHEESECAKE MILK TEA
            'CCMM5','CCML5','CCMM10','CCML10','CCMM3','CCML3',
            'CCMM7','CCML7','CCMM4','CCML4','CCMM1','CCML1',
            'CCMM2','CCML2','CCMM6','CCML6',
            'BCCKM1','BCCKL1',
            'CCMM11','CCML11',
            'CCMM12','CCML12',
            // CREAM CHEESE MILK TEA
            'CRMM2','CRML2','CRMM7','CRML7','CRMM5','CRML5',
            'CRMM8','CRML8','CRMM1','CRML1','CRMM4','CRML4','CRMM3','CRML3',
            'CRMM9','CRML9',
            'CRMM10','CRML10',
            'CRMM11','CRML11',
            // FP COFFEE BUNDLES
            'COF1','COF2',
            // GF DUO BUNDLES
            'GF1','GF2','GF3','GF4',
            // PUMPKIN SPICE MILK TEA only
            'PO1',
            // ROCK SALT & CHEESE
            'RCM6','RCL6','RCM5','RCL5','RCM1','RCL1',
            'RCM2','RCL2','RCM3','RCL3',
            // OKINAWA BROWN SUGAR
            'OKM1','OKL1','OKM2','OKL2','OKM3','OKL3',
            // YAKULT SERIES
            'YSM1','YSL1','YSM3','YSL3','YSM2','YSL2','YSM6','YSL6',
            'YSM4','YSL4','YSM5','YSL5','YSM7','YSL7',
            // FP/GF FET2 CLASSIC
            '2M','1M','GC3','GC2',
        ];

        // ── ICE ONLY ─────────────────────────────────────────────────────
        $iceOnly = [
            // CLASSIC MILKTEA
            'CMM1','CML1','CMM2','CML2','CMM8','CML8','CMM9','CML9',
            'CMM3','CML3','CMM4','CML4','CMM5','CML5','CMM6','CML6','CMM7','CML7',
            // FRUIT SODA SERIES
            'FS1','FS3','FS2','FS6','FS5','FS4',
            // GREEN TEA SERIES
            'FTSM4','FTSL4','FTSM3','FTSL3','FTSM1','FTSL1',
            'FTSM5','FTSL5','FTSM2','FTSL2','FTSM6','FTSL6',
            // LUCKY CLASSIC JR
            'LCO1','LCBP1','LCWP1','LCPD1',
            // YOGURT SERIES
            'YGOP','YOGST','YOGBRY','YOGSTRY',
            // PUMPKIN SPICE iced coffee & frappe variants
            'PO4','PO5',
        ];

        // ── NO OPTIONS (HOT DRINKS & HOT COFFEE — no ice, no pearl) ──────
        // These are intentionally excluded from both arrays above.

        $now = now();

        $allBarcodes = array_merge($pearlAndIce, $iceOnly);
        $itemMap = DB::table('menu_items')
            ->whereIn('barcode', $allBarcodes)
            ->pluck('id', 'barcode');

        $rows = [];

        foreach ($pearlAndIce as $barcode) {
            $id = $itemMap[$barcode] ?? null;
            if (!$id) continue;
            $rows[] = ['menu_item_id' => $id, 'option_type' => 'pearl', 'created_at' => $now, 'updated_at' => $now];
            $rows[] = ['menu_item_id' => $id, 'option_type' => 'ice',   'created_at' => $now, 'updated_at' => $now];
        }

        foreach ($iceOnly as $barcode) {
            $id = $itemMap[$barcode] ?? null;
            if (!$id) continue;
            $rows[] = ['menu_item_id' => $id, 'option_type' => 'ice', 'created_at' => $now, 'updated_at' => $now];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('menu_item_options')->insertOrIgnore($chunk);
        }

        $this->command->info('MenuItemOptionSeeder done — ' . count($rows) . ' options seeded.');
    }
}