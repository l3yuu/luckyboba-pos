<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sales = DB::table('sales')
    ->where('branch_id', 1)
    ->whereDate('created_at', '2026-04-08')
    ->get(['id', 'invoice_number', 'total_amount', 'sc_discount_amount', 'pwd_discount_amount', 'vatable_sales', 'vat_amount', 'vat_exempt_sales', 'status']);

echo json_encode($sales, JSON_PRETTY_PRINT);
