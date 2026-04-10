<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sale = DB::table('sales')->where('invoice_number', 'SI-000000007')->first();
echo "SI-007:\n";
echo "Vatable: " . $sale->vatable_sales . "\n";
echo "VAT: " . $sale->vat_amount . "\n";
echo "Exempt: " . $sale->vat_exempt_sales . "\n";
echo "Total Amount: " . $sale->total_amount . "\n";
echo "SC Discount: " . $sale->sc_discount_amount . "\n";
