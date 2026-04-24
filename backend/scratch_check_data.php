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
        if ($decoded !== null && !is_array($decoded)) {
            echo "BAD DATA (not array): " . $a . "\n";
        } elseif ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            echo "BAD DATA (invalid json): " . $a . " Error: " . json_last_error_msg() . "\n";
        }
    }
}
echo "DONE\n";
