<?php

require __DIR__.'/../backend/vendor/autoload.php';
$app = require_once __DIR__.'/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RawMaterial;

$rms = RawMaterial::all();
foreach ($rms as $rm) {
    echo "ID: {$rm->id}, Name: {$rm->name}, Unit: {$rm->unit}\n";
}
