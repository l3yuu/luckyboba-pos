<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Recipe;
use App\Models\Category;

echo "--- VERIFYING RECIPES FOR CATEGORY 12 (FLAVORED MILK TEA) ---\n";
$category = Category::where('id', 12)->first();
if (!$category) {
    die("Category 12 not found.\n");
}

$recipes = Recipe::whereHas('menuItem', function ($q) {
    $q->where('category_id', 12);
})->with('items.rawMaterial')->get();

foreach ($recipes as $recipe) {
    echo "\nRecipe: {$recipe->name} (MenuItem ID: {$recipe->menu_item_id}, Size: {$recipe->size})\n";
    foreach ($recipe->items as $item) {
        $rmName = $item->rawMaterial->name ?? 'Unknown';
        echo "  - {$rmName}: {$item->quantity} {$item->unit}\n";
    }
}
