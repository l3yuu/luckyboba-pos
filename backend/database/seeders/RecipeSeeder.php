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
        $rm = RawMaterial::whereNull('branch_id')->pluck('id', 'name');
        $units = RawMaterial::whereNull('branch_id')->pluck('unit', 'name');

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

        $normalize = function (string $value): string {
            $v = strtoupper(trim($value));
            $v = preg_replace('/\s+/', ' ', $v) ?? $v;
            return $v;
        };

        $menuItemsBySize = MenuItem::select(['id', 'name', 'size'])->get()->groupBy('size');
        $resolveMenuItem = function (string $itemName, string $size) use ($menuItemsBySize, $normalize) {
            $candidates = collect([
                $itemName,
                str_replace(' COFFEE', '', $itemName),
                str_replace(' MILK TEA', '', $itemName),
            ])->map(fn ($n) => $normalize($n))->unique()->values();

            $pool = collect($menuItemsBySize->get($size, []));
            return $pool->first(function ($m) use ($candidates, $normalize) {
                return $candidates->contains($normalize($m->name));
            });
        };

        $straw = 'STRAW';
        $sealing = 'SEALING MACHINE COUNT';
        $mCup = 'M-SLIM CUP 16oz (50pcs/pk)';
        $lCup = 'L-SLIM CUP 22oz (25pcs/pk)';
        $boba = 'PEARL, BLACK BOBA (900g/pk)';
        $tea = 'LEAVES, BLACK TEA (60g) (10bags/pk)';
        $ndc = 'POWDER, NDC (1kg/pk)';
        $jelly = 'JELLY, COCONUT (3.5kg/pk)';
        $mixedJelly = 'JELLY, MIXED FRUIT (3.5kg/pk)';
        $cheese = 'ALL CHEESES (MIXED)';
        $oreo = 'CRUSHED OREO (454g/pk)';
        $greenTeaBag = 'LEAVES, GREEN TEA -BAG (5g) (50Tbag/pk)';
        $greenTeaLoose = 'LEAVES, GREEN TEA -LOOSE (500g/pk)';
        $pCup8 = '8oz PAPER CUP (25pcs/pk)';
        $pCup12 = '12oz PAPER CUP (25pcs/pk)';
        $milkFoam = 'POWDER, MILK FOAM (1kg/pk)';
        $groundCoffee = 'GROUND COFFEE (1kg/pk)';

        // ----------------------------------------------------------------
        // 1. CLASSIC MILK TEA CATEGORY
        // ----------------------------------------------------------------
        $classicRecipes = [
            ['CLASSIC MILK TEA', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.078), $frac($ndc, 0.047)]],
            ['CLASSIC MILK TEA', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.091), $frac($ndc, 0.054)]],
            ['CLASSIC PEARL', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03)]],
            ['CLASSIC PEARL', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04)]],
            ['CLASSIC OREO', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['CLASSIC OREO', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049)]],
            ['CLASSIC PUDDING', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['CLASSIC PUDDING', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049)]],
            ['CLASSIC BUDDY', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03)]],
            ['CLASSIC BUDDY', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04)]],
            ['CLASSIC DUO', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($jelly, 0.02)]],
            ['CLASSIC DUO', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($jelly, 0.03)]],
            ['CLASSIC CREAM CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($cheese, 45)]],
            ['CLASSIC CREAM CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($cheese, 55)]],
            ['CLASSIC CHEESE CAKE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($cheese, 45)]],
            ['CLASSIC CHEESE CAKE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($cheese, 55)]],
            ['CLASSIC ROCKSALT & CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($boba, 0.03), $frac($cheese, 45)]],
            ['CLASSIC ROCKSALT & CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($tea, 0.081), $frac($ndc, 0.049), $frac($boba, 0.04), $frac($cheese, 55)]],
        ];

        // ----------------------------------------------------------------
        // 2. CREAM CHEESE SERIES CATEGORY
        // ----------------------------------------------------------------
        $creamcheeseRecipes = [
            ['RED VELVET + CREAM CHEESE',   'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['RED VELVET + CREAM CHEESE',   'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['TARO + CREAM CHEESE',         'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['TARO + CREAM CHEESE',         'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['VANILLA + CREAM CHEESE',      'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['VANILLA + CREAM CHEESE',      'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['MATCHA + CREAM CHEESE',       'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.041), $frac($cheese, 45)]],
            ['MATCHA + CREAM CHEESE',       'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['BELGIAN CHOCO + CREAM CHEESE','M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.026), $frac($cheese, 45)]],
            ['BELGIAN CHOCO + CREAM CHEESE','L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.038), $frac($cheese, 55)]],
            ['SALTED CARAMEL + CREAM CHEESE','M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['SALTED CARAMEL + CREAM CHEESE','L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['HERSHEYS + CREAM CHEESE',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['HERSHEYS + CREAM CHEESE',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['CHOCO HAZELNUT + CREAM CHEESE','M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['CHOCO HAZELNUT + CREAM CHEESE','L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['BLUEBERRY + CREAM CHEESE',    'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['BLUEBERRY + CREAM CHEESE',    'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['OKINAWA + CREAM CHEESE',      'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['OKINAWA + CREAM CHEESE',      'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
        ];

        // ----------------------------------------------------------------
        // 3. CHEESECAKE SERIES CATEGORY
        // ----------------------------------------------------------------
        $cheesecakeRecipes = [
            ['TARO + CHEESECAKE',           'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['TARO + CHEESECAKE',           'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['COOKIES & CREAM + CHEESECAKE','M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45), $frac($oreo, 0.01)]],
            ['COOKIES & CREAM + CHEESECAKE','L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55), $frac($oreo, 0.02)]],
            ['STRAWBERRY + CHEESECAKE',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['STRAWBERRY + CHEESECAKE',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['VANILLA + CHEESECAKE',        'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['VANILLA + CHEESECAKE',        'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['SALTED CARAMEL + CHEESECAKE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['SALTED CARAMEL + CHEESECAKE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['OKINAWA + CHEESECAKE',        'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['OKINAWA + CHEESECAKE',        'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['CHOCO HAZELNUT + CHEESECAKE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['CHOCO HAZELNUT + CHEESECAKE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['MANGO + CHEESECAKE',          'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.016), $frac($cheese, 45)]],
            ['MANGO + CHEESECAKE',          'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.056), $frac($cheese, 55)]],
            ['BLUEBERRY + CHEESECAKE',      'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['BLUEBERRY + CHEESECAKE',      'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['MATCHA + CHEESECAKE',         'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['MATCHA + CHEESECAKE',         'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['BELGIAN CHOCO M. TEA + CHEESECAKE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.034), $frac($cheese, 45)]],
            ['BELGIAN CHOCO M. TEA + CHEESECAKE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
        ];

        // ----------------------------------------------------------------
        // 4. ROCK SALT & CHEESE SERIES CATEGORY
        // ----------------------------------------------------------------
        $rocksaltRecipes = [
            ['WINTERMELON + ROCK SALT & CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['WINTERMELON + ROCK SALT & CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['DARK CHOCOLATE + ROCK SALT & CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.026), $frac($cheese, 45)]],
            ['DARK CHOCOLATE + ROCK SALT & CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.038), $frac($cheese, 55)]],
            ['VANILLA + ROCK SALT & CHEESE',    'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['VANILLA + ROCK SALT & CHEESE',    'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['MANGO + ROCK SALT & CHEESE',      'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036), $frac($cheese, 45)]],
            ['MANGO + ROCK SALT & CHEESE',      'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041), $frac($cheese, 55)]],
            ['AVOCADO + ROCK SALT & CHEESE',    'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['AVOCADO + ROCK SALT & CHEESE',    'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
            ['SALTED CARAMEL + ROCK SALT & CHEESE', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($cheese, 45)]],
            ['SALTED CARAMEL + ROCK SALT & CHEESE', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($cheese, 55)]],
        ];

        // ----------------------------------------------------------------
        // 5. FLAVORED MILK TEA SERIES CATEGORY (Category 12)
        // ----------------------------------------------------------------
        $flavoredRecipes = [
            ['WINTERMELON MILK TEA',        'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036)]],
            ['WINTERMELON MILK TEA',        'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['RED VELVET MILK TEA',         'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['RED VELVET MILK TEA',         'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['AVOCADO MILK TEA',            'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['AVOCADO MILK TEA',            'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['MANGO MILK TEA',              'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036)]],
            ['MANGO MILK TEA',              'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['TARO MILK TEA',               'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['TARO MILK TEA',               'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['BELGIAN MILK TEA',            'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['BELGIAN MILK TEA',            'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['HERSHEY\'S MILK TEA',         'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['HERSHEY\'S MILK TEA',         'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['SALTED CARAMEL MILK TEA',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['SALTED CARAMEL MILK TEA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['DARK CHOCOLATE MILK TEA',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.034)]],
            ['DARK CHOCOLATE MILK TEA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['CHOCO HAZELNUT MILK TEA',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.026)]],
            ['CHOCO HAZELNUT MILK TEA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.038)]],
            ['COOKIES & CREAM MILK TEA',    'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021), $frac($oreo, 0.01)]],
            ['COOKIES & CREAM MILK TEA',    'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028), $frac($oreo, 0.02)]],
            ['TOFFEE CARAMEL MILK TEA',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['TOFFEE CARAMEL MILK TEA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['VANILLA MILK TEA',            'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036)]],
            ['VANILLA MILK TEA',            'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['BLUEBERRY MILK TEA',          'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036)]],
            ['BLUEBERRY MILK TEA',          'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['OKINAWA MILK TEA',            'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.031)]],
            ['OKINAWA MILK TEA',            'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.043)]],
            ['MOCHA MILK TEA',              'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['MOCHA MILK TEA',              'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['JAVA CHIP MILK TEA',          'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['JAVA CHIP MILK TEA',          'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['MATCHA MILK TEA',             'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['MATCHA MILK TEA',             'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
            ['STRAWBERRY MILK TEA',         'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.059), $frac($ndc, 0.036)]],
            ['STRAWBERRY MILK TEA',         'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.069), $frac($ndc, 0.041)]],
            ['CARAMEL MACCHIATO MILK TEA',  'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($tea, 0.034), $frac($ndc, 0.021)]],
            ['CARAMEL MACCHIATO MILK TEA',  'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($tea, 0.047), $frac($ndc, 0.028)]],
        ];

        // ----------------------------------------------------------------
        // 6. HOT COFFEE SERIES CATEGORY
        // ----------------------------------------------------------------
        $hotCoffeeRecipes = [
            ['DARK ROAST COFFEE',     'M', [$frac($straw, 1), $frac($pCup8, 1), $frac($groundCoffee, 0.01)]],
            ['DARK ROAST COFFEE',     'L', [$frac($straw, 1), $frac($pCup12, 1), $frac($groundCoffee, 0.01)]],
            ['HOT MOCHA COFFEE',      'M', [$frac($straw, 1), $frac($pCup8, 1), $frac($groundCoffee, 0.01)]],
            ['HOT MOCHA COFFEE',      'L', [$frac($straw, 1), $frac($pCup12, 1), $frac($groundCoffee, 0.01)]],
            ['HOT CARAMEL MACCHIATO', 'M', [$frac($straw, 1), $frac($pCup8, 1), $frac($groundCoffee, 0.01)]],
            ['HOT CARAMEL MACCHIATO', 'L', [$frac($straw, 1), $frac($pCup12, 1), $frac($groundCoffee, 0.01)]],
        ];

        // ----------------------------------------------------------------
        // 7. ICED COFFEE SERIES CATEGORY
        // ----------------------------------------------------------------
        $icedCoffeeRecipes = [
            ['ICED COFFEE CLASSIC',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($ndc, 0.013), $frac($groundCoffee, 0.01)]],
            ['ICED COFFEE CLASSIC',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($ndc, 0.02),  $frac($groundCoffee, 0.01)]],
            ['ICED MOCHA COFFEE',       'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($ndc, 0.013), $frac($groundCoffee, 0.01)]],
            ['ICED MOCHA COFFEE',       'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($ndc, 0.02),  $frac($groundCoffee, 0.01)]],
            ['ICED VANILLA COFFEE',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($ndc, 0.013), $frac($groundCoffee, 0.01)]],
            ['ICED VANILLA COFFEE',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($ndc, 0.02),  $frac($groundCoffee, 0.01)]],
            ['ICED JAVA CHIP COFFEE',   'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($ndc, 0.013), $frac($groundCoffee, 0.01)]],
            ['ICED JAVA CHIP COFFEE',   'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($ndc, 0.02),  $frac($groundCoffee, 0.01)]],
            ['ICED TOFFEE CARAMEL',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($ndc, 0.013), $frac($groundCoffee, 0.01)]],
            ['ICED TOFFEE CARAMEL',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($ndc, 0.02),  $frac($groundCoffee, 0.01)]],
            ['ICED CARAMEL MACCHIATO',  'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($boba, 0.03), $frac($ndc, 0.013), $frac($groundCoffee, 0.01)]],
            ['ICED CARAMEL MACCHIATO',  'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04), $frac($ndc, 0.02),  $frac($groundCoffee, 0.01)]],
        ];

        // ----------------------------------------------------------------
        // 8. COFFEE FRAPPE CATEGORY
        // ----------------------------------------------------------------
        $mUCup = 'M-U CUP 16oz (50pcs/pk)';
        $lUCup = 'L-U CUP 22oz (50pcs/pk)';
        $bearLid = 'BEAR LID (100pcs/pk)';
        $monalisa = 'MONALISA (1L/BX)';
        $coffeeFrappeRecipes = [
            ['MOCHA FRAPPE',              'M', [$frac($straw, 1), $frac($mUCup, 1), $frac($bearLid, 1), $frac($boba, 0.03), $frac($ndc, 0.025), $frac($monalisa, 0.06)]],
            ['MOCHA FRAPPE',              'L', [$frac($straw, 1), $frac($lUCup, 1), $frac($bearLid, 1), $frac($boba, 0.04), $frac($ndc, 0.3),   $frac($monalisa, 0.06), $frac($groundCoffee, 0.01)]],
            ['VANILLA FRAPPE',            'M', [$frac($straw, 1), $frac($mUCup, 1), $frac($bearLid, 1), $frac($boba, 0.03), $frac($ndc, 0.3),   $frac($monalisa, 0.06)]],
            ['VANILLA FRAPPE',            'L', [$frac($straw, 1), $frac($lUCup, 1), $frac($bearLid, 1), $frac($boba, 0.04), $frac($ndc, 0.35),  $frac($monalisa, 0.06), $frac($groundCoffee, 0.01)]],
            ['JAVA CHIP FRAPPE',          'M', [$frac($straw, 1), $frac($mUCup, 1), $frac($bearLid, 1), $frac($boba, 0.03), $frac($ndc, 0.025), $frac($monalisa, 0.06)]],
            ['JAVA CHIP FRAPPE',          'L', [$frac($straw, 1), $frac($lUCup, 1), $frac($bearLid, 1), $frac($boba, 0.04), $frac($ndc, 0.3),   $frac($monalisa, 0.06), $frac($groundCoffee, 0.01)]],
            ['TOFFEE CARAMEL FRAPPE',     'M', [$frac($straw, 1), $frac($mUCup, 1), $frac($bearLid, 1), $frac($boba, 0.3),  $frac($ndc, 0.025), $frac($monalisa, 0.06)]],
            ['TOFFEE CARAMEL FRAPPE',     'L', [$frac($straw, 1), $frac($lUCup, 1), $frac($bearLid, 1), $frac($boba, 0.04), $frac($ndc, 0.3),   $frac($monalisa, 0.06), $frac($groundCoffee, 0.01)]],
            ['CARAMEL MACCHIATO FRAPPE',  'M', [$frac($straw, 1), $frac($mUCup, 1), $frac($bearLid, 1), $frac($boba, 0.3),  $frac($ndc, 0.025), $frac($monalisa, 0.06)]],
            ['CARAMEL MACCHIATO FRAPPE',  'L', [$frac($straw, 1), $frac($lUCup, 1), $frac($bearLid, 1), $frac($boba, 0.04), $frac($ndc, 0.3),   $frac($monalisa, 0.06), $frac($groundCoffee, 0.01)]],
        ];

        // ----------------------------------------------------------------
        // 9. FRUIT SODA SERIES CATEGORY
        // ----------------------------------------------------------------
        $fruitSodaRecipes = [
            ['BLUEBERRY FRUIT SODA',   'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
            ['BERRIES FRUIT SODA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
            ['STRAWBERRY FRUIT SODA',  'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
            ['GREEN APPLE FRUIT SODA', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
            ['LEMON FRUIT SODA',       'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
            ['PASSION FRUIT SODA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
            ['LYCHEE FRUIT SODA',      'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($mixedJelly, 0.01), $frac($boba, 0.03)]],
        ];

        // ----------------------------------------------------------------
        // 10. NOVA SERIES CATEGORY
        // ----------------------------------------------------------------
        $novaRecipes = [
            ['BERRIES NOVA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04)]],
            ['MANGO LEMON NOVA', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04)]],
            ['LYCHEE LEM NOVA',  'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04)]],
            ['STRAWBERRY NOVA',  'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04)]],
            ['GREEN APPLE NOVA', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($boba, 0.04)]],
        ];

        // ----------------------------------------------------------------
        // 11. GREEN TEA SERIES CATEGORY
        // ----------------------------------------------------------------
        $greenteaRecipes = [
            ['PASSION FRUIT GREEN TEA',  'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['PASSION FRUIT GREEN TEA',  'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['HONEY LEMON GREEN TEA',    'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['HONEY LEMON GREEN TEA',    'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['WINTERMELON GREEN TEA',    'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['WINTERMELON GREEN TEA',    'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['LEMON CUCUMBER GREEN TEA', 'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['LEMON CUCUMBER GREEN TEA', 'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['LEMON CHIA GREEN TEA',     'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['LEMON CHIA GREEN TEA',     'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['LYCHEE GREEN TEA',         'M', [$frac($straw, 1), $frac($mCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
            ['LYCHEE GREEN TEA',         'L', [$frac($straw, 1), $frac($lCup, 1), $frac($sealing, 1), $frac($greenTeaBag, 1), $frac($greenTeaLoose, 0.01)]],
        ];

        $allRecipes = array_merge(
            $classicRecipes,
            $creamcheeseRecipes,
            $cheesecakeRecipes,
            $rocksaltRecipes,
            $flavoredRecipes,
            $hotCoffeeRecipes,
            $icedCoffeeRecipes,
            $coffeeFrappeRecipes,
            $fruitSodaRecipes,
            $novaRecipes,
            $greenteaRecipes
        );

        $seededCount = 0;
        foreach ($allRecipes as [$itemName, $size, $ingredients]) {
            $menuItem = $resolveMenuItem($itemName, $size);
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

        $this->command->info("RecipeSeeder: Seeded $seededCount recipes successfully.");
    }
}