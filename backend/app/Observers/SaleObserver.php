<?php
namespace App\Observers;

use App\Models\Sale;
use App\Models\RawMaterial;
use App\Models\StockDeduction;
use App\Models\StockMovement;
use App\Models\Recipe;
use Illuminate\Support\Facades\Log;

class SaleObserver
{
    public function updated(Sale $sale): void
    {
        if ($sale->isDirty('status') && $sale->status === 'cancelled') {
            $this->reverseDeductions($sale);
        }
    }


    private function reverseDeductions(Sale $sale): void
    {
        $deductions = StockDeduction::where('sale_id', $sale->id)->get();
        if ($deductions->isEmpty()) return;

        /** @var \App\Models\StockDeduction $d */
        foreach ($deductions as $d) {
            RawMaterial::where('id', $d->raw_material_id)
                ->increment('current_stock', (float) $d->quantity_deducted);

            // Reverse the StockMovement too so Usage Report is accurate
            StockMovement::create([
                'raw_material_id' => $d->raw_material_id,
                'type'            => 'add',
                'quantity'        => $d->quantity_deducted,
                'reason'          => "Void · Sale #{$sale->invoice_number}",
            ]);

            $d->delete();
        }
    }
}