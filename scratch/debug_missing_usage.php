<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$period = '2026-04'; // Monthly
$parts = explode('-', $period);
$year = $parts[0];
$month = $parts[1];
$startDate = "{$year}-{$month}-01 00:00:00";
$endDate = date('Y-m-t', strtotime($startDate)) . " 23:59:59";

echo "Period: $startDate to $endDate\n";

$sales = DB::table('sale_items')
    ->select('product_name', DB::raw('count(*) as count'))
    ->whereBetween('created_at', [$startDate, $endDate])
    ->groupBy('product_name')
    ->get();

foreach ($sales as $sale) {
    $usageCount = DB::table('stock_deductions')
        ->join('sale_items', 'stock_deductions.sale_item_id', '=', 'sale_items.id')
        ->where('sale_items.product_name', $sale->product_name)
        ->whereBetween('stock_deductions.created_at', [$startDate, $endDate])
        ->count();
    
    echo "Product: [{$sale->product_name}] | Sales Items: {$sale->count} | Deductions Found: $usageCount\n";
}
