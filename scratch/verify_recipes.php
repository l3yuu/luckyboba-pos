<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;
use App\Models\Recipe;
use App\Models\RecipeItem;

echo "--- VERIFYING RECIPES FOR CATEGORY 19 (CLASSIC MILKTEA) ---\n";
$targetIds = range(67, 84);
$recipes = Recipe::whereIn('menu_item_id', $targetIds)->with('items.rawMaterial')->get();

foreach ($recipes as $recipe) {
    echo "\nRecipe: {$recipe->name} (MenuItem ID: {$recipe->menu_item_id}, Size: {$recipe->size})\n";
    foreach ($recipe->items as $item) {
        $rmName = $item->rawMaterial->name ?? 'Unknown';
        echo "  - {$rmName}: {$item->quantity} {$item->unit}\n";
    }
}
