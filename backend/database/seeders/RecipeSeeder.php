<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\RawMaterial;
use App\Models\MenuItem;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        $rm = RawMaterial::pluck('id', 'name');
        $units = RawMaterial::pluck('unit', 'name');

        $frac = function (string $material, float $amount) use ($rm, $units): array {
            if (!isset($rm[$material])) {
                throw new \Exception("Raw material not found: $material");
            }
            return [
                'raw_material_id' => $rm[$material],
                'quantity'        => round($amount, 8),
                'unit'            => strtolower($units[$material] ?? 'pack'),
            ];
        };

        // ----------------------------------------------------------------
        // 1. CLASSIC MILK TEA CATEGORY (Based on Spreadsheet)
        // ----------------------------------------------------------------
        $straw = 'STRAW';
        $sealing = 'SEALING MACHINE COUNT';
        $mCup = 'M-SLIM CUP 16oz (50pcs/pk)';
        $lCup = 'L-SLIM CUP 22oz (25pcs/pk)';
        $boba = 'PEARL, BLACK BOBA (900g/pk)';
        $tea = 'LEAVES, BLACK TEA (60g) (10bags/pk)';
        $ndc = 'POWDER, NDC (1kg/pk)';
        $jelly = 'JELLY, COCONUT (3.5kg/pk)';
        $cheese = 'ALL CHEESES (MIXED)';

        $classicRecipes = [
            // Plain Classic
            ['CLASSIC MILK TEA', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.078), $frac($ndc, 0.047)]],
            ['CLASSIC MILK TEA', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.091), $frac($ndc, 0.054)]],

            // Classic Pearl
            ['CLASSIC PEARL', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03)]],
            ['CLASSIC PEARL', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04)]],

            // Classic Oreo
            ['CLASSIC OREO', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['CLASSIC OREO', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049)]],

            // Classic Pudding
            ['CLASSIC PUDDING', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['CLASSIC PUDDING', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049)]],

            // Classic Buddy
            ['CLASSIC BUDDY', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03)]],
            ['CLASSIC BUDDY', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04)]],

            // Classic Duo
            ['CLASSIC DUO', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($jelly, 0.02)]],
            ['CLASSIC DUO', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($jelly, 0.03)]],

            // Classic Cream Cheese
            ['CLASSIC CREAM CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($cheese, 45)]],
            ['CLASSIC CREAM CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($cheese, 55)]],

            // Classic Cheesecake
            ['CLASSIC CHEESE CAKE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($cheese, 45)]],
            ['CLASSIC CHEESE CAKE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($cheese, 55)]],

            // Classic Rocksalt & Cheese
            ['CLASSIC ROCKSALT & CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($cheese, 45)]],
            ['CLASSIC ROCKSALT & CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($cheese, 55)]],
        ];

        $seededCount = 0;
        foreach ($classicRecipes as [$itemName, $size, $ingredients]) {
            $menuItem = MenuItem::where('name', $itemName)->where('size', $size)->first();
            if (!$menuItem) {
                $this->command->warn("MenuItem not found: $itemName ($size)");
                continue;
            }

            // Clear and overwrite as requested
            RecipeItem::whereIn('recipe_id', Recipe::where('menu_item_id', $menuItem->id)->pluck('id'))->delete();
            Recipe::where('menu_item_id', $menuItem->id)->delete();

            $recipe = Recipe::create([
                'menu_item_id' => $menuItem->id,
                'size'         => $size,
                'name'         => "$itemName $size",
                'is_active'    => true
            ]);

            foreach ($ingredients as $ingredient) {
                RecipeItem::create([
                    'recipe_id'       => $recipe->id,
                    'raw_material_id' => $ingredient['raw_material_id'],
                    'quantity'        => $ingredient['quantity'],
                    'unit'            => $ingredient['unit'],
                ]);
            }
            $seededCount++;
        }

        $this->command->info("RecipeSeeder: Seeded $seededCount classic milktea recipes.");
    }
}