<?php
namespace App\Observers;

use App\Models\Sale;
use App\Models\RawMaterial;
use App\Models\StockDeduction;
use App\Models\Recipe;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SaleObserver
{
    public function updated(Sale $sale): void
    {
        if ($sale->isDirty('status') && $sale->status === 'cancelled') {
            $this->reverseDeductions($sale);
        }
    }

    public function deductStock(Sale $sale): void
    {
        $sale->load('items'); // force fresh load, not loadMissing

        DB::transaction(function () use ($sale) {
            foreach ($sale->items as $saleItem) {
                $recipe = Recipe::where('menu_item_id', $saleItem->menu_item_id)
                    ->where('size', $saleItem->size)
                    ->where('is_active', true)
                    ->with('items')
                    ->first();

                if (!$recipe) {
                    Log::info("[Inventory] No recipe — skipped.", [
                        'menu_item_id' => $saleItem->menu_item_id,
                        'size'         => $saleItem->size,
                        'sale_id'      => $sale->id,
                    ]);
                    continue;
                }

                foreach ($recipe->items as $recipeItem) {
                    $totalQty = $recipeItem->quantity * $saleItem->quantity;

                    RawMaterial::where('id', $recipeItem->raw_material_id)
                        ->decrement('current_stock', $totalQty);

                    StockDeduction::create([
                        'sale_id'           => $sale->id,
                        'sale_item_id'      => $saleItem->id,
                        'raw_material_id'   => $recipeItem->raw_material_id,
                        'recipe_item_id'    => $recipeItem->id,
                        'quantity_deducted' => $totalQty,
                    ]);
                }
            }
        });
    }

    private function reverseDeductions(Sale $sale): void
    {
        $deductions = StockDeduction::where('sale_id', $sale->id)->get();
        if ($deductions->isEmpty()) return;

        DB::transaction(function () use ($deductions) {
            foreach ($deductions as $d) {
                RawMaterial::where('id', $d->raw_material_id)
                    ->increment('current_stock', $d->quantity_deducted);
                $d->delete();
            }
        });
    }
}