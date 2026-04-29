<?php

namespace App\Actions\Inventory;

use App\Models\Sale;
use App\Models\RawMaterial;
use App\Models\StockDeduction;
use App\Models\StockMovement;
use App\Models\Recipe;
use Illuminate\Support\Facades\Log;

class DeductStockFromSaleAction
{
    /**
     * Deducts RawMaterials based on the Sale items and records stock movements.
     */
    public function execute(Sale $sale): void
    {
        $sale->loadMissing('items');

        foreach ($sale->items as $saleItem) {
            $primarySize = $saleItem->cup_size_label;
            $fallbackSize = ($saleItem->size !== 'none') ? $saleItem->size : null;

            $recipe = Recipe::where('menu_item_id', $saleItem->menu_item_id)
                ->where('is_active', true)
                ->where(function ($q) use ($primarySize) {
                    if ($primarySize) $q->where('size', $primarySize);
                    else $q->whereNull('size');
                })
                ->with('items')
                ->first();

            // Fallback if primary size (label) missed but standardized size exists
            if (!$recipe && $fallbackSize && $fallbackSize !== $primarySize) {
                $recipe = Recipe::where('menu_item_id', $saleItem->menu_item_id)
                    ->where('is_active', true)
                    ->where('size', $fallbackSize)
                    ->with('items')
                    ->first();
            }

            if (!$recipe) {
                Log::info("[Inventory Action] No active recipe found — skipped.", [
                    'menu_item_id'    => $saleItem->menu_item_id,
                    'product_name'    => $saleItem->product_name,
                    'primary_size'    => $primarySize,
                    'fallback_size'   => $fallbackSize,
                    'sale_id'         => $sale->id,
                ]);
                continue;
            }

            foreach ($recipe->items as $recipeItem) {
                $totalQty = $recipeItem->quantity * $saleItem->quantity;

                $material = RawMaterial::where('branch_id', $sale->branch_id)
                    ->where(function ($q) use ($recipeItem) {
                        $q->where('id', $recipeItem->raw_material_id)
                          ->orWhere('parent_id', $recipeItem->raw_material_id);
                    })
                    ->lockForUpdate()
                    ->first();

                // FALLBACK: If no branch-specific material found, use the global material but attribute to the branch
                if (!$material) {
                    $material = RawMaterial::whereNull('branch_id')
                        ->where('id', $recipeItem->raw_material_id)
                        ->lockForUpdate()
                        ->first();
                }

                if (!$material) {
                    Log::warning("[Inventory Action] No branch or global material found for deduction.", [
                        'branch_id'       => $sale->branch_id,
                        'recipe_item_id'  => $recipeItem->raw_material_id,
                        'product'         => $saleItem->product_name,
                    ]);
                    continue;
                }

                $material->recordMovement(
                    $totalQty,
                    'subtract',
                    "Sale #{$sale->invoice_number} · {$saleItem->product_name}",
                    null,
                    $sale->branch_id // Pass the branch ID to ensure movement is recorded for this branch
                );

                StockDeduction::create([
                    'sale_id'           => $sale->id,
                    'sale_item_id'      => $saleItem->id,
                    'raw_material_id'   => $material->id,
                    'recipe_item_id'    => $recipeItem->id,
                    'quantity_deducted' => $totalQty,
                ]);
            }
        }
    }
}
