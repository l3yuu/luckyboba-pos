<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Models\RawMaterial;
use Illuminate\Console\Command;

class SyncRawMaterialsToBranches extends Command
{
    protected $signature = 'inventory:sync-materials';
    protected $description = 'Clone global (null branch_id) raw materials to all branches that are missing them';

    public function handle(): int
    {
        $globals = RawMaterial::whereNull('branch_id')->get();

        if ($globals->isEmpty()) {
            $this->warn('No global raw materials found.');
            return 0;
        }

        $branches = Branch::all();
        $created  = 0;

        foreach ($branches as $branch) {
            /** @var \App\Models\RawMaterial $global */
            foreach ($globals as $global) {
                // Check if this branch already has a copy (by name match or parent_id)
                $exists = RawMaterial::where('branch_id', $branch->id)
                    ->where(function ($q) use ($global) {
                        $q->where('parent_id', $global->id)
                          ->orWhere('name', $global->name);
                    })
                    ->exists();

                if (!$exists) {
                    $clone = $global->replicate();
                    $clone->branch_id = $branch->id;
                    $clone->parent_id = $global->id;
                    $clone->current_stock = 0; // New branch starts with 0 stock
                    $clone->save();
                    $created++;
                }
            }
        }

        $this->info("Synced {$created} raw material(s) across {$branches->count()} branch(es).");
        return 0;
    }
}
