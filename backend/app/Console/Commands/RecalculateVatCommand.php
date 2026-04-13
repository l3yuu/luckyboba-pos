<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;

/**
 * Batch-fix historical sales affected by the discount double-subtraction
 * and broken recalculateVat logic.
 *
 * What it fixes on each sale:
 * 1. total_amount: undoes the double-subtraction of discount_amount
 *    when it duplicated sc+pwd+diplomat+other
 * 2. VAT components: re-runs the anchored recalculateVat() logic
 *    so that vatable_sales + vat_amount + vat_exempt_sales ≡ total_amount
 *
 * Usage:
 *   php artisan sales:recalculate-vat --dry-run       # preview only
 *   php artisan sales:recalculate-vat --branch=1      # fix branch 1
 *   php artisan sales:recalculate-vat                 # fix all
 */
class RecalculateVatCommand extends Command
{
    protected $signature = 'sales:recalculate-vat
                            {--branch= : Branch ID to filter (optional)}
                            {--dry-run : Preview changes without applying}';

    protected $description = 'Recalculate total_amount and VAT components for all completed sales (BIR compliance fix)';

    public function handle(): int
    {
        $dryRun   = $this->option('dry-run');
        $branchId = $this->option('branch');

        $this->info($dryRun ? '🔍 DRY RUN — no changes will be applied' : '🔧 APPLYING FIXES');
        $this->newLine();

        $query = Sale::where('status', 'completed');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $sales       = $query->get();
        $totalFixed  = 0;
        $totalAmount = 0;
        $vatFixed    = 0;

        $this->output->progressStart($sales->count());

        /** @var Sale $sale */
        foreach ($sales as $sale) {
            $currentTotal = (float) $sale->total_amount;
            $hasItems     = DB::table('sale_items')->where('sale_id', $sale->id)->exists();
            $newTotal     = $currentTotal;

            // ── Step 1: Fix total_amount IF items exist ──
            if ($hasItems) {
                $itemSum     = (float) DB::table('sale_items')->where('sale_id', $sale->id)->sum('final_price');
                $itemDiscSum = (float) DB::table('sale_items')->where('sale_id', $sale->id)->sum('discount_amount');

                $rawGeneric   = (float) ($sale->discount_amount ?? 0);
                $scDisc       = (float) ($sale->sc_discount_amount ?? 0);
                $pwdDisc      = (float) ($sale->pwd_discount_amount ?? 0);
                $diplomatDisc = (float) ($sale->diplomat_discount_amount ?? 0);
                $otherDisc    = (float) ($sale->other_discount_amount ?? 0);

                $categorized    = $scDisc + $pwdDisc + $diplomatDisc + $otherDisc;
                $uncategorized  = max(0, $rawGeneric - $categorized);
                $correctTotal   = max(0, round($itemSum - $itemDiscSum - $uncategorized - $categorized, 2));

                // ONLY fix if we detect the double-subtraction bug (current total is too low)
                if ($correctTotal > $currentTotal + 0.1) {
                    $totalFixed++;
                    $totalAmount += ($correctTotal - $currentTotal);
                    $newTotal = $correctTotal;
                    
                    if (!$dryRun) {
                        $sale->update(['total_amount' => $newTotal]);
                    }

                    if ($dryRun) {
                        $this->newLine();
                        $this->warn("  Sale #{$sale->id} ({$sale->invoice_number}): total_amount {$currentTotal} → {$newTotal}");
                    }
                }
            }

            // ── Step 2: Recalculate VAT components (Always, even without items) ──
            // Anchored on the (fixed or original) total_amount
            $scDiscount  = (float) ($sale->sc_discount_amount ?? 0);
            $pwdDiscount = (float) ($sale->pwd_discount_amount ?? 0);
            $totalScPwd  = $scDiscount + $pwdDiscount;

            $vatExemptSales = 0.0;
            if ($totalScPwd > 0) {
                $vatExemptSales = round($totalScPwd / 0.20 * 0.80, 2);
                $vatExemptSales = min($vatExemptSales, $newTotal);
            }

            $vatableGross = round($newTotal - $vatExemptSales, 2);
            $vatableSales = round($vatableGross / 1.12, 2);
            $vatAmount    = round($vatableGross - $vatableSales, 2);

            // PERFECT BALANCING: Ensure golden rule: vatable + vat + exempt = total
            $residual = round($newTotal - ($vatableSales + $vatAmount + $vatExemptSales), 2);
            if (abs($residual) > 0 && abs($residual) <= 0.05) {
                $vatableSales = round($vatableSales + $residual, 2);
            }

            $vatChanged = abs((float)$sale->vatable_sales - $vatableSales) > 0.01
                       || abs((float)$sale->vat_amount - $vatAmount) > 0.01
                       || abs((float)$sale->vat_exempt_sales - $vatExemptSales) > 0.01;

            if ($vatChanged) {
                $vatFixed++;
                if (!$dryRun) {
                    $sale->update([
                        'vatable_sales'    => $vatableSales,
                        'vat_amount'       => $vatAmount,
                        'vat_exempt_sales' => $vatExemptSales,
                    ]);
                }

                if ($dryRun) {
                    $this->newLine();
                    $this->warn("  Sale #{$sale->id} ({$sale->invoice_number}): VAT [{$sale->vatable_sales}/{$sale->vat_amount}/{$sale->vat_exempt_sales}] → [{$vatableSales}/{$vatAmount}/{$vatExemptSales}]");
                }
            }

            $this->output->progressAdvance();
        }

        $this->output->progressFinish();
        $this->newLine();

        $this->info("📊 Results:");
        $this->info("   Total sales scanned:  {$sales->count()}");
        $this->info("   total_amount fixed:   {$totalFixed} (total Δ₱" . round($totalAmount, 2) . ")");
        $this->info("   VAT components fixed: {$vatFixed}");

        if ($dryRun && ($totalFixed > 0 || $vatFixed > 0)) {
            $this->newLine();
            $this->warn('Run without --dry-run to apply these changes.');
        }

        if (!$dryRun && ($totalFixed > 0 || $vatFixed > 0)) {
            $this->newLine();
            $this->info('✅ All fixes applied. Run diagnose_vat.php to verify.');
        }

        return self::SUCCESS;
    }
}
