<?php

use App\Models\RawMaterial;
use App\Models\RecipeItem;
use App\Models\Branch;
use App\Models\Sale;
use App\Actions\Inventory\DeductStockFromSaleAction;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::transaction(function () {
    echo "--- Stage 1: Synchronizing Branch Raw Materials ---\n";
    $masters = RawMaterial::whereNull('branch_id')->get();
    $branches = Branch::all();

    /** @var RawMaterial $master */
    foreach ($masters as $master) {
        foreach ($branches as $branch) {
            $exists = RawMaterial::where('parent_id', $master->id)
                ->where('branch_id', $branch->id)
                ->exists();

            if (!$exists) {
                echo "  - Creating clone for {$master->name} in Branch #{$branch->id}\n";
                $clone = $master->replicate();
                $clone->branch_id = $branch->id;
                $clone->parent_id = $master->id;
                $clone->save();
            }
        }
    }

    echo "\n--- Stage 2: Masterizing Recipe Items ---\n";
    $recipeItems = RecipeItem::with('rawMaterial')->get();
    $updateCount = 0;

    /** @var RecipeItem $item */
    foreach ($recipeItems as $item) {
        if ($item->rawMaterial && !is_null($item->rawMaterial->branch_id)) {
            $masterId = $item->rawMaterial->parent_id;
            if ($masterId) {
                echo "  - Updating Recipe Item #{$item->id}: Branch ID #{$item->raw_material_id} -> Master ID #{$masterId}\n";
                $item->update(['raw_material_id' => $masterId]);
                $updateCount++;
            }
        }
    }
    echo "Total Recipe Items standardized: $updateCount\n";

    echo "\n--- Stage 3: Retroactive Inventory Deduction ---\n";
    $deductAction = app(DeductStockFromSaleAction::class);
    
    // Find completed sales from today that have NO stock_deductions
    $salesToRepair = Sale::where('status', 'completed')
        ->whereDate('created_at', date('Y-m-d'))
        ->whereNotExists(function ($query) {
            $query->select(DB::raw(1))
                ->from('stock_deductions')
                ->whereColumn('stock_deductions.sale_id', 'sales.id');
        })
        ->get();

    echo "Found " . $salesToRepair->count() . " sales needing repair.\n";

    foreach ($salesToRepair as $sale) {
        echo "  - Processing Sale #{$sale->id} (Invoice: {$sale->invoice_number})...\n";
        try {
            $deductAction->execute($sale);
            echo "    ✓ Deduction successful.\n";
        } catch (\Exception $e) {
            echo "    [FAIL] Error processing sale #{$sale->id}: " . $e->getMessage() . "\n";
        }
    }
});

echo "\n✓ Usage Data Repair Complete.\n";
