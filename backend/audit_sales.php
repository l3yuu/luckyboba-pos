<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

$startDate = '2026-04-06';
$endDate = '2026-04-14';

$sales = Sale::whereBetween('created_at', [$startDate, $endDate])
    ->where('status', 'completed')
    ->get();

$discrepancies = [];
foreach ($sales as $sale) {
    $itemSum = (float) DB::table('sale_items')->where('sale_id', $sale->id)->sum('final_price');
    $itemDiscSum = (float) DB::table('sale_items')->where('sale_id', $sale->id)->sum('discount_amount');
    
    $orderDiscounts = (float)$sale->discount_amount + 
                      (float)$sale->sc_discount_amount + 
                      (float)$sale->pwd_discount_amount + 
                      (float)$sale->diplomat_discount_amount + 
                      (float)$sale->other_discount_amount;
                      
    $expectedTotal = round($itemSum - $itemDiscSum - $orderDiscounts, 2);
    $diff = abs((float)$sale->total_amount - $expectedTotal);
    
    if ($diff > 0.05) {
        $discrepancies[] = [
            'id' => $sale->id,
            'invoice' => $sale->invoice_number,
            'recorded' => $sale->total_amount,
            'expected' => $expectedTotal,
            'diff' => $diff,
            'other_disc' => $sale->other_discount_amount
        ];
    }
}

echo "Found " . count($discrepancies) . " discrepancies.\n";
foreach ($discrepancies as $d) {
    echo "ID: {$d['id']} | OR: {$d['invoice']} | Rec: {$d['recorded']} | Exp: {$d['expected']} | Diff: {$d['diff']} | Other: {$d['other_disc']}\n";
}
