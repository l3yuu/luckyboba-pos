<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;
use App\Models\Branch;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\SalesController;

$branchId = 1;
$date = '2026-04-08';

$sales = Sale::where('branch_id', $branchId)
    ->whereDate('created_at', $date)
    ->get();

$controller = app(SalesController::class);
$branch = Branch::find($branchId);
$isVat = ($branch?->vat_type ?? 'vat') !== 'non_vat';

echo "Recalculating " . $sales->count() . " sales for branch $branchId on $date...\n";

foreach ($sales as $sale) {
    echo "Processing {$sale->invoice_number}: Total={$sale->total_amount}, SC={$sale->sc_discount_amount}, PWD={$sale->pwd_discount_amount}\n";
    
    $mockRequest = new Request([
        'total' => (float)$sale->total_amount,
        'sc_discount_amount' => (float)$sale->sc_discount_amount,
        'pwd_discount_amount' => (float)$sale->pwd_discount_amount,
        'vat_exempt_sales' => 0 // Force auto-calc logic I just added
    ]);

    $controller->recalculateSaleFinancials($sale, $mockRequest, $isVat);
    
    $sale->refresh();
    echo "  -> RESULT: Vatable={$sale->vatable_sales}, VAT={$sale->vat_amount}, Exempt={$sale->vat_exempt_sales}\n";
}

echo "Done.\n";
