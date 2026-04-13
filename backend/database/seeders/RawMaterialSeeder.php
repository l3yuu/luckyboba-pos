<?php

namespace Database\Seeders;

use App\Models\RawMaterial;
use Illuminate\Database\Seeder;

class RawMaterialSeeder extends Seeder
{
    public function run(): void
    {
        // All 32 items from the SM San Lazaro Daily Inventory Excel
        // Format: [name, unit, category, is_intermediate, reorder_level]
        $items = [
            // ── Packaging ────────────────────────────────────────────────────
            ['M-U CUP 16oz (50pcs/pk)',               'PC',  'Packaging',     false, 100],
            ['L-U CUP 22oz (50pcs/pk)',               'PC',  'Packaging',     false, 100],
            ['M-SLIM CUP 16oz (50pcs/pk)',            'PC',  'Packaging',     false, 100],
            ['L-SLIM CUP 22oz (25pcs/pk)',            'PC',  'Packaging',     false, 100],
            ['8oz PAPER CUP (25pcs/pk)',              'PC',  'Packaging',     false,  50],
            ['12oz PAPER CUP (25pcs/pk)',             'PC',  'Packaging',     false,  50],
            ['BEAR LID (100pcs/pk)',                  'PC',  'Packaging',     false, 100],
            ['DELIGHT (1pk)',                         'PC',  'Packaging',     false,  10],
            ['SEALING MACHINE COUNT',                 'PC',  'Equipment',     false,   0],
            ['LUCKY CARD',                            'PC',  'Packaging',     false,  20],
            ['STRAW',                                 'PC',  'Packaging',     false, 100],

            // ── Ingredients ──────────────────────────────────────────────────
            ['PEARL, BLACK BOBA (900g/pk)',           'PK',  'Ingredients',   false,   5],
            ['PEARL, MINI WHITE (1kg/pk)',            'PK',  'Ingredients',   false,   5],
            ['LEAVES, BLACK TEA (60g) (10bags/pk)',   'BAG', 'Ingredients',   false,   5],
            ['LEAVES, GREEN TEA -BAG (5g) (50Tbag/pk)', 'BAG', 'Ingredients', false,  5],
            ['LEAVES, GREEN TEA -LOOSE (500g/pk)',    'PK',  'Ingredients',   false,   3],
            ['POWDER, NDC (1kg/pk)',                  'PK',  'Ingredients',   false,   5],
            ['POWDER, MILK FOAM (1kg/pk)',            'PK',  'Ingredients',   false,   3],
            ['BUNGEE (1L/BX)',                        'BX',  'Ingredients',   false,   3],
            ['MONALISA (1L/BX)',                      'BX',  'Ingredients',   false,   3],
            ['POWDER, CHEESE MOUSSE (1kg/pk)',        'PK',  'Ingredients',   false,   3],
            ['CRUSHED OREO (454g/pk)',                'PK',  'Ingredients',   false,   3],
            ['POWDER, MILO (300g/pk)',                'PK',  'Ingredients',   false,   3],
            ['JELLY, COCONUT (3.5kg/pk)',             'BTL', 'Ingredients',   false,   2],
            ['JELLY, COFFEE (3.5kg/pk)',              'BTL', 'Ingredients',   false,   2],
            ['POWDER, PUDDING (1kg/pk)',              'PK',  'Ingredients',   false,   3],
            ['GROUND COFFEE (1kg/pk)',                'PK',  'Ingredients',   false,   3],
            ['JELLY, MIXED FRUIT (3.5kg/pk)',         'BTL', 'Ingredients',   false,   2],

            // ── Intermediate (cooked/mixed — tracked separately) ─────────────
            ['MILK TEA (COOKED)',                     'ML',  'Intermediate',  true,    0],
            ['NDC MILK (COOKED)',                     'ML',  'Intermediate',  true,    0],
            ['MILK FOAM (MIXED)',                     'G',   'Intermediate',  true,    0],
            ['CHEESE MOUSSE (MIXED)',                 'G',   'Intermediate',  true,    0],
            ['ALL CHEESES (MIXED)',                   'G',   'Intermediate',  true,    0],
        ];

        foreach ($items as [$name, $unit, $category, $isIntermediate, $reorderLevel]) {
            RawMaterial::firstOrCreate(
                ['name' => $name],  // prevent duplicate runs
                [
                    'unit'            => $unit,
                    'category'        => $category,
                    'is_intermediate' => $isIntermediate,
                    'current_stock'   => 0,
                    'reorder_level'   => $reorderLevel,
                ]
            );
        }

        $this->command->info('✓ RawMaterialSeeder: 32 items seeded.');
    }
}