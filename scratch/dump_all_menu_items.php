<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;
use App\Models\Category;

$categories = Category::all();
foreach ($categories as $cat) {
    echo "--- Category: {$cat->name} (ID: {$cat->id}) ---\n";
    $items = MenuItem::where('category_id', $cat->id)->get();
    foreach ($items as $item) {
        echo "  ID: {$item->id}, Name: {$item->name}, Size: {$item->size}\n";
    }
    echo "\n";
}
