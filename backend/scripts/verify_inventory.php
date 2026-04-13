<?php

use App\Models\RawMaterial;
use App\Models\RecipeItem;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Running Inventory Integrity Check...\n\n";

// 1. Check masters without clones
$masters = RawMaterial::whereNull('branch_id')->get();
echo "Total Masters: " . $masters->count() . "\n";
foreach ($masters as $m) {
    $clones = RawMaterial::where('parent_id', $m->id)->count();
    if ($clones < 2) {
        echo "  [WARN] Master #{$m->id} ({$m->name}) only has $clones clones.\n";
    }
}

// 2. Check orphaned clones
$orphans = RawMaterial::whereNotNull('parent_id')
    ->whereNotExists(function($q) {
        $q->select(DB::raw(1))
          ->from('raw_materials as masters')
          ->whereColumn('masters.id', 'raw_materials.parent_id');
    })->get();
echo "\nOrphaned Clones: " . $orphans->count() . "\n";
foreach ($orphans as $o) {
    echo "  [FAIL] Clone #{$o->id} ({$o->name}) points to non-existent parent #{$o->parent_id}\n";
}

// 3. Check broken recipes
$brokenRecipes = RecipeItem::whereNotExists(function($q) {
    $q->select(DB::raw(1))
      ->from('raw_materials')
      ->whereColumn('raw_materials.id', 'recipe_items.raw_material_id');
})->get();
echo "\nBroken Recipe Items: " . $brokenRecipes->count() . "\n";
foreach ($brokenRecipes as $br) {
    echo "  [FAIL] Recipe Item #{$br->id} points to non-existent material #{$br->raw_material_id}\n";
}

echo "\nCheck Complete.\n";
