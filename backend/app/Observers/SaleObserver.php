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

    public function deductStock(Sale $sale): void
    {
        $sale->load('items');

        // NOTE: DB::transaction() wrapper removed intentionally.
        // This method is always called from within SalesController's
        // existing DB::transaction(), so a nested transaction here
        // can cause silent rollbacks on MySQL. The outer transaction
        // already guarantees atomicity.

        foreach ($sale->items as $saleItem) {

            // Use cup_size_label (JR, SM, SL...) if available,
            // otherwise fall back to size (M, L), otherwise null
            $recipeSize = $saleItem->cup_size_label
                ?? ($saleItem->size !== 'none' ? $saleItem->size : null);

            $recipe = Recipe::where('menu_item_id', $saleItem->menu_item_id)
                ->where('is_active', true)
                ->where(function ($q) use ($recipeSize) {
                    if ($recipeSize) {
                        $q->where('size', $recipeSize);
                    } else {
                        $q->whereNull('size');
                    }
                })
                ->with('items')
                ->first();

            if (!$recipe) {
                Log::info("[Inventory] No active recipe found — skipped.", [
                    'menu_item_id'    => $saleItem->menu_item_id,
                    'product_name'    => $saleItem->product_name,
                    'size'            => $saleItem->size,
                    'cup_size_label'  => $saleItem->cup_size_label ?? 'n/a',
                    'recipe_size_key' => $recipeSize ?? 'NULL',
                    'sale_id'         => $sale->id,
                ]);
                continue;
            }

            Log::info("[Inventory] Recipe matched.", [
                'recipe_id'      => $recipe->id,
                'menu_item_id'   => $saleItem->menu_item_id,
                'recipe_size'    => $recipe->size,
                'qty_sold'       => $saleItem->quantity,
                'ingredient_cnt' => $recipe->items->count(),
            ]);

            foreach ($recipe->items as $recipeItem) {
                $totalQty = $recipeItem->quantity * $saleItem->quantity;

                // ✅ NEW: Find the branch-specific raw material
                $material = RawMaterial::where('branch_id', $sale->branch_id)
                    ->where(function ($q) use ($recipeItem) {
                        $q->where('id', $recipeItem->raw_material_id)
                          ->orWhere('parent_id', $recipeItem->raw_material_id);
                    })
                    ->first();

                if (!$material) {
                    Log::warning("[Inventory] No branch-specific material found for deduction.", [
                        'branch_id'       => $sale->branch_id,
                        'recipe_item_id'  => $recipeItem->raw_material_id,
                        'product'         => $saleItem->product_name,
                    ]);
                    // Fallback to global if branch-specific is missing (optional, but safer to skip/warn)
                    continue;
                }

                $material->decrement('current_stock', $totalQty);

                StockDeduction::create([
                    'sale_id'           => $sale->id,
                    'sale_item_id'      => $saleItem->id,
                    'raw_material_id'   => $material->id, // Use branch-specific ID
                    'recipe_item_id'    => $recipeItem->id,
                    'quantity_deducted' => $totalQty,
                ]);

                // Also create a StockMovement so it shows in the Usage Report
                StockMovement::create([
                    'raw_material_id' => $material->id, // Use branch-specific ID
                    'branch_id'       => $sale->branch_id,
                    'type'            => 'subtract',
                    'quantity'        => $totalQty,
                    'reason'          => "Sale #{$sale->invoice_number} · {$saleItem->product_name}",
                ]);
            }
        }
    }

    private function reverseDeductions(Sale $sale): void
    {
        $deductions = StockDeduction::where('sale_id', $sale->id)->get();
        if ($deductions->isEmpty()) return;

        /** @var \App\Models\StockDeduction $d */
        foreach ($deductions as $d) {
            RawMaterial::where('id', $d->raw_material_id)
                ->increment('current_stock', $d->quantity_deducted);

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