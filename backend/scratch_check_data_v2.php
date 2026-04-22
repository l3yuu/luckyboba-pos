<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$addons = DB::table('sale_items')
    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
    ->whereDate('sales.created_at', '2026-04-22')
    ->pluck('add_ons');

foreach ($addons as $a) {
    if ($a) {
        $decoded = json_decode($a, true);
        if (is_array($decoded)) {
            foreach ($decoded as $val) {
                if (!is_string($val) && !is_numeric($val)) {
                    echo "BAD DATA (not string/numeric in array): " . $a . " Value type: " . gettype($val) . "\n";
                }
            }
        }
    }
}
echo "DONE\n";
