<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$period = '2026-04-13'; // Use today for test
$startDate = $period . ' 00:00:00';
$endDate = $period . ' 23:59:59';

$usagePerProduct = DB::table('stock_deductions')
    ->join('sale_items', 'stock_deductions.sale_item_id', '=', 'sale_items.id')
    ->join('raw_materials', 'stock_deductions.raw_material_id', '=', 'raw_materials.id')
    ->select(
        'sale_items.product_name',
        'raw_materials.name as material_name',
        'raw_materials.unit',
        DB::raw('SUM(stock_deductions.quantity_deducted) as total_usage')
    )
    ->whereBetween('stock_deductions.created_at', [$startDate, $endDate])
    ->groupBy('sale_items.product_name', 'raw_materials.name', 'raw_materials.unit')
    ->get()
    ->groupBy('product_name');

print_r($usagePerProduct->toArray());
