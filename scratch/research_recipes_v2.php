<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;
use App\Models\RawMaterial;
use App\Models\Category;

echo "--- ALL CATEGORIES ---\n";
$categories = Category::all();
foreach ($categories as $cat) {
    echo "ID: {$cat->id}, Name: {$cat->name}\n";
}

echo "\n--- SEARCHING FOR CORE MENU ITEMS ---\n";
$searchNames = [
    'CLASSIC MILK TEA',
    'CLASSIC PEARL MILK TEA',
    'CLASSIC BUDDY',
    'CLASSIC DUO',
    'CLASSIC CREAM CHEESE',
    'CLASSIC ROCKSALT',
    'CLASSIC CHEESECAKE',
    'CLASSIC OREO',
    'CLASSIC PUDDING'
];

foreach ($searchNames as $name) {
    $items = MenuItem::where('name', 'LIKE', "%$name%")->get();
    echo "\nSearching for: $name\n";
    foreach ($items as $item) {
        echo "  ID: {$item->id}, Name: {$item->name}, Size: {$item->size}, CategoryID: {$item->category_id}\n";
    }
}

echo "\n--- CHECKING STRAW RAW MATERIAL ---\n";
$straws = RawMaterial::where('name', 'LIKE', '%STRAW%')->get();
foreach ($straws as $s) {
    echo "ID: {$s->id}, Name: {$s->name}\n";
}
