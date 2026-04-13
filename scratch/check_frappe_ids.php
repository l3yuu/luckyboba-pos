<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;

echo "--- FRAPPE MENU ITEMS ---\n";
$items = MenuItem::where('name', 'LIKE', '%FRP%')->orWhere('name', 'LIKE', '%FRAPPE%')->get();
foreach ($items as $item) {
    echo "ID: {$item->id}, Name: {$item->name}, Size: {$item->size}\n";
}
