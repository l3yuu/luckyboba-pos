<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;
use App\Models\RawMaterial;
use App\Models\Category;

echo "--- CATEGORIES ---\n";
$categories = Category::where('name', 'LIKE', '%Classic Milk Tea%')->get();
foreach ($categories as $cat) {
    echo "ID: {$cat->id}, Name: {$cat->name}\n";
}

echo "\n--- MENU ITEMS (Classic Milk Tea) ---\n";
$items = MenuItem::whereHas('category', function($q) {
    $q->where('name', 'LIKE', '%Classic Milk Tea%');
})->get();
foreach ($items as $item) {
    echo "ID: {$item->id}, Name: {$item->name}, Size: {$item->size}, Price: {$item->price}\n";
}

echo "\n--- RAW MATERIALS ---\n";
$materials = RawMaterial::all();
foreach ($materials as $mat) {
    echo "ID: {$mat->id}, Name: {$mat->name}, Unit: {$mat->unit}\n";
}
