<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;
use App\Models\RawMaterial;
use App\Models\Recipe;

echo "--- MENU ITEMS IN CATEGORY 19 (CLASSIC MILKTEA) ---\n";
$items = MenuItem::where('category_id', 19)->get();
foreach ($items as $item) {
    echo "ID: {$item->id}, Name: {$item->name}, Size: {$item->size}\n";
}

echo "\n--- CHECKING IF ANY RECIPES ALREADY EXIST FOR THESE ITEMS ---\n";
foreach ($items as $item) {
    if ($item->size && $item->size !== 'none') {
        $recipe = Recipe::where('menu_item_id', $item->id)->where('size', $item->size)->first();
        if ($recipe) {
            echo "Recipe exists for: {$item->name} ({$item->size}) - ID: {$recipe->id}\n";
        }
    } else {
         $recipe = Recipe::where('menu_item_id', $item->id)->first();
         if ($recipe) {
            echo "Recipe exists for: {$item->name} - ID: {$recipe->id}\n";
         }
    }
}
