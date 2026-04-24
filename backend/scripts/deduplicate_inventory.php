<?php

use App\Models\RawMaterial;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

/**
 * MAPPING: [OLD_GLOBAL_ID => NEW_GLOBAL_ID]
 */
$mapping = [
    1  => 28,  // BLACK BOBA PEARL -> PEARL, BLACK BOBA (900g/pk)
    2  => 29,  // MINI WHITE PEARL -> PEARL, MINI WHITE (1kg/pk)
    3  => 30,  // BLACK TEA LEAVES -> LEAVES, BLACK TEA (60g) (10bags/pk)
    4  => 33,  // NDC POWDER -> POWDER, NDC (1kg/pk)
    5  => 43,  // GROUND COFFEE -> GROUND COFFEE (1kg/pk)
    6  => 35,  // BUNGEE SYRUP -> BUNGEE (1L/BX)
    7  => 37,  // CHEESE MOUSSE POWDER -> POWDER, CHEESE MOUSSE (1kg/pk)
    8  => 49,  // ALL CHEESES -> ALL CHEESES (MIXED)
    9  => 38,  // CRUSHED OREO -> CRUSHED OREO (454g/pk)
    10 => 39,  // MILO POWDER -> POWDER, MILO (300g/pk)
    11 => 40,  // COCONUT JELLY -> JELLY, COCONUT (3.5kg/pk)
    12 => 41,  // COFFEE JELLY -> JELLY, COFFEE (3.5kg/pk)
    13 => 42,  // PUDDING POWDER -> POWDER, PUDDING (1kg/pk)
    14 => 44,  // MIXED FRUIT JELLY -> JELLY, MIXED FRUIT (3.5kg/pk)
    15 => 34,  // MILK FOAM POWDER -> POWDER, MILK FOAM (1kg/pk)
    16 => 31,  // GREEN TEA BAG -> LEAVES, GREEN TEA -BAG (5g) (50Tbag/pk)
    17 => 32,  // GREEN TEA LOOSE -> LEAVES, GREEN TEA -LOOSE (500g/pk)
];

DB::transaction(function () use ($mapping) {
    foreach ($mapping as $oldId => $newId) {
        echo "Processing Merge: Global #$oldId into Global #$newId\n";

        $oldMaterial = RawMaterial::find($oldId);
        $newMaterial = RawMaterial::find($newId);

        if (!$oldMaterial || !$newMaterial) {
            echo "  - Warning: Skipping merge, one or both materials not found ($oldId or $newId)\n";
            continue;
        }

        // 1. Update Global References
        updateReferences($oldId, $newId);

        // 2. Identify and Merge Branch Clones
        /** @var \Illuminate\Database\Eloquent\Collection|RawMaterial[] $oldClones */
        $oldClones = RawMaterial::where('parent_id', $oldId)->get();
        /** @var RawMaterial $oldClone */
        foreach ($oldClones as $oldClone) {
            $branchId = $oldClone->branch_id;
            
            // Find the corresponding new clone for the same branch
            $newClone = RawMaterial::where('parent_id', $newId)
                ->where('branch_id', $branchId)
                ->first();

            if ($newClone) {
                echo "    - Merging Branch #$branchId: #{$oldClone->id} into #{$newClone->id}\n";
                
                // Merge Stock
                $newClone->current_stock += $oldClone->current_stock;
                $newClone->save();

                // Update References for branch-specific clone
                updateReferences($oldClone->id, $newClone->id);

                // Delete old clone
                $oldClone->delete();
            } else {
                echo "    - Note: No matching new clone for Branch #$branchId, re-parenting old clone #{$oldClone->id} to #$newId instead.\n";
                // If there's no new clone, just re-parent the old one so data isn't lost
                $oldClone->update(['parent_id' => $newId]);
            }
        }

        // 3. Delete Old Global Material
        $oldMaterial->delete();
        echo "  - Done.\n";
    }
});

function updateReferences($oldId, $newId) {
    // Recipe Items
    DB::table('recipe_items')->where('raw_material_id', $oldId)->update(['raw_material_id' => $newId]);
    
    // Logs
    DB::table('raw_material_logs')->where('raw_material_id', $oldId)->update(['raw_material_id' => $newId]);
    
    // Deductions
    DB::table('stock_deductions')->where('raw_material_id', $oldId)->update(['raw_material_id' => $newId]);
    
    // Movements
    DB::table('stock_movements')->where('raw_material_id', $oldId)->update(['raw_material_id' => $newId]);
    
    // Transfer Items
    DB::table('stock_transfer_items')->where('raw_material_id', $oldId)->update(['raw_material_id' => $newId]);
    
    // Supplier Materials (Pivot)
    DB::table('supplier_materials')->where('raw_material_id', $oldId)->update(['raw_material_id' => $newId]);
}

echo "\n✓ Inventory Deduplication Complete.\n";
