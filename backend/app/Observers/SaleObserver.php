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
            $material = RawMaterial::find($d->raw_material_id);
            if ($material) {
                $material->recordMovement(
                    (float) $d->quantity_deducted,
                    'add',
                    "Void · Sale #{$sale->invoice_number}"
                );
            }

            $d->delete();
        }
    }
}