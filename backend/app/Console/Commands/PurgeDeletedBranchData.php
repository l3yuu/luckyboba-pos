<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;

class PurgeDeletedBranchData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'branch:purge-deleted-data {--force : Force the operation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete all data associated with soft-deleted branches.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $deletedBranches = Branch::onlyTrashed()->get();

        if ($deletedBranches->isEmpty()) {
            $this->info('No soft-deleted branches found.');
            return 0;
        }

        $this->info('Found ' . $deletedBranches->count() . ' soft-deleted branches:');
        foreach ($deletedBranches as $branch) {
            $this->line("- {$branch->name} (ID: {$branch->id}, Deleted: {$branch->deleted_at})");
        }

        if (!$this->option('force')) {
            if (!$this->confirm('Are you sure you want to permanently delete ALL sales, receipts, and inventory records for these branches? This cannot be undone.')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $branchIds = $deletedBranches->pluck('id')->toArray();

        DB::transaction(function () use ($branchIds) {
            // 1. Delete Sales & related
            $saleIds = DB::table('sales')->whereIn('branch_id', $branchIds)->pluck('id')->toArray();
            
            if (!empty($saleIds)) {
                DB::table('stock_deductions')->whereIn('sale_id', $saleIds)->delete();
                DB::table('sale_items')->whereIn('sale_id', $saleIds)->delete();
                DB::table('receipts')->whereIn('sale_id', $saleIds)->delete();
                DB::table('sales')->whereIn('id', $saleIds)->delete();
            }

            // 2. Delete inventory records
            DB::table('stock_movements')->whereIn('branch_id', $branchIds)->delete();
            DB::table('stock_transactions')->whereExists(function ($query) use ($branchIds) {
                $query->select(DB::raw(1))
                    ->from('menu_items')
                    ->whereColumn('menu_items.id', 'stock_transactions.menu_item_id')
                    ->whereIn('menu_items.branch_id', $branchIds);
            })->delete();
            
            DB::table('menu_items')->whereIn('branch_id', $branchIds)->delete();
            DB::table('raw_materials')->whereIn('branch_id', $branchIds)->delete();

            // 3. Delete financial records
            DB::table('cash_counts')->whereIn('branch_id', $branchIds)->delete();
            DB::table('cash_transactions')->whereIn('branch_id', $branchIds)->delete();
            DB::table('expenses')->whereIn('branch_id', $branchIds)->delete();

            // 4. Finally, permanently delete the branches
            DB::table('branches')->whereIn('id', $branchIds)->whereNotNull('deleted_at')->delete();
        });

        $this->info('Successfully purged all data for ' . count($branchIds) . ' deleted branches.');
        return 0;
    }
}
