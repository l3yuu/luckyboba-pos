<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Receipt;
use App\Models\StockDeduction;
use App\Models\CashCount;
use App\Models\ZReading;
use Illuminate\Support\Facades\DB;

class CleanupOrphanedSales extends Command
{
    protected $signature = 'sales:cleanup-orphaned';
    protected $description = 'Permanently delete sales data associated with soft-deleted branches';

    public function handle()
    {
        // Get branches that have been soft-deleted
        $deletedBranches = Branch::onlyTrashed()->get();

        if ($deletedBranches->isEmpty()) {
            $this->info("No soft-deleted branches found.");
            return;
        }

        $this->info("Found " . $deletedBranches->count() . " deleted branches.");

        foreach ($deletedBranches as $branch) {
            $this->warn("Cleaning up sales for branch: {$branch->name} (ID: {$branch->id})");

            DB::transaction(function() use ($branch) {
                $saleIds = Sale::where('branch_id', $branch->id)->pluck('id');

                if ($saleIds->isNotEmpty()) {
                    $this->line(" - Deleting " . $saleIds->count() . " sales and related records...");
                    
                    SaleItem::whereIn('sale_id', $saleIds)->delete();
                    Receipt::whereIn('sale_id', $saleIds)->delete();
                    StockDeduction::whereIn('sale_id', $saleIds)->delete();
                    Sale::whereIn('id', $saleIds)->delete();
                }

                $this->line(" - Deleting cash counts and readings...");
                CashCount::where('branch_id', $branch->id)->delete();
                ZReading::where('branch_id', $branch->id)->delete();
            });
        }

        $this->info("Cleanup complete.");
    }
}
