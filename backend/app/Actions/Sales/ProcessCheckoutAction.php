<?php

namespace App\Actions\Sales;

use App\Models\Branch;
use App\Models\Discount;
use App\Models\MenuItem;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Actions\Inventory\DeductStockFromSaleAction;
use App\Services\DashboardService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessCheckoutAction
{
    protected DashboardService $dashboardService;
    protected DeductStockFromSaleAction $deductStockAction;

    public function __construct(
        DashboardService $dashboardService,
        DeductStockFromSaleAction $deductStockAction
    ) {
        $this->dashboardService = $dashboardService;
        $this->deductStockAction = $deductStockAction;
    }

    /**
     * Executes the main checkout flow for the point of sale.
     */
    public function execute(array $data, ?int $userId, ?int $branchId, string $cashierName): array
    {
        $officialOR = $data['si_number'];

        // 1. Idempotency Check
        $existing = Sale::with('items')
            ->where('invoice_number', $officialOR)
            ->where('branch_id', $branchId)
            ->first();

        if ($existing) {
            return [
                'status' => 'success',
                'is_new' => false,
                'sale'   => $existing,
            ];
        }

        try {
            DB::beginTransaction();

            $chargeType          = $this->resolveChargeType($data['payment_method'] ?? 'cash', $data['items']);
            $effectiveDiscountId = $this->resolveEffectiveDiscountId($data);

            $scDiscountAmount       = (float) ($data['sc_discount_amount'] ?? 0);
            $pwdDiscountAmount      = (float) ($data['pwd_discount_amount'] ?? 0);
            $diplomatDiscountAmount = (float) ($data['diplomat_discount_amount'] ?? 0);
            $otherDiscountAmount    = (float) ($data['other_discount_amount'] ?? 0);

            $branch = Branch::find($branchId);
            $isVat  = ($branch?->vat_type ?? 'vat') !== 'non_vat';

            // 2. Create Sale header
            $sale = Sale::create([
                'user_id'                  => $userId,
                'branch_id'                => $branchId,
                'total_amount'             => 0, // Placeholder
                'invoice_number'           => $officialOR,
                'status'                   => 'completed',
                'payment_method'           => $data['payment_method'] ?? 'cash',
                'reference_number'         => $data['reference_number'] ?? null,
                'charge_type'              => $chargeType,
                'discount_id'              => $effectiveDiscountId,
                'discount_amount'          => (float) ($data['discount_amount'] ?? 0),
                'sc_discount_amount'       => $scDiscountAmount,
                'pwd_discount_amount'      => $pwdDiscountAmount,
                'diplomat_discount_amount' => $diplomatDiscountAmount,
                'other_discount_amount'    => $otherDiscountAmount,
                'vatable_sales'            => 0,
                'vat_amount'               => 0,
                'vat_exempt_sales'         => (float) ($data['vat_exempt_sales'] ?? 0),
                'vat_type'                 => $data['vat_type'] ?? 'vat',
                'customer_name'            => $data['customer_name'] ?? null,
                'is_synced'                => false,
                'cash_tendered'            => (float) ($data['cash_tendered'] ?? 0),
                'pax_senior'               => $data['pax_senior'] ?? null,
                'pax_pwd'                  => $data['pax_pwd'] ?? null,
                'senior_id'                => $data['senior_id'] ?? null,
                'pwd_id'                   => $data['pwd_id'] ?? null,
                'pax_discount_ids'         => $data['pax_discount_ids'] ?? null,
            ]);

            // 3. Create Sale Items
            $totalQty = 0;
            foreach ($data['items'] as $item) {
                $hasCharge  = !empty($item['charges']['grab']) || !empty($item['charges']['panda']);
                $basePrice  = (float) $item['unit_price'];
                $totalPrice = (float) $item['total_price'];
                $surcharge  = $hasCharge ? round($totalPrice - ($basePrice * $item['quantity']), 2) : 0;
                $totalQty  += $item['quantity'];

                $itemDiscountAmount = 0;
                if (!empty($item['discount_type']) && isset($item['discount_value'])) {
                    $itemDiscountAmount = $item['discount_type'] === 'percent'
                        ? round($basePrice * $item['quantity'] * ($item['discount_value'] / 100), 2)
                        : round((float) $item['discount_value'] * $item['quantity'], 2);
                }

                SaleItem::create([
                    'sale_id'            => $sale->id,
                    'menu_item_id'       => $item['menu_item_id'] ?? null,
                    'bundle_id'          => $item['bundle_id'] ?? null,
                    'product_name'       => $item['name'],
                    'quantity'           => $item['quantity'],
                    'unit_price'         => $basePrice,
                    'price'              => $basePrice,
                    'final_price'        => $totalPrice,
                    'size'               => $item['size'] ?? null,
                    'cup_size_label'     => $item['cup_size_label'] ?? null,
                    'sugar_level'        => $item['sugar_level'] ?? null,
                    'options'            => $item['options'] ?? null,
                    'add_ons'            => $item['add_ons'] ?? null,
                    'bundle_components'  => isset($item['bundle_components']) ? json_encode($item['bundle_components']) : null,
                    'charge_type'        => $hasCharge ? ($item['charges']['grab'] ? 'grab' : 'panda') : null,
                    'surcharge'          => $surcharge,
                    'discount_id'        => $item['discount_id'] ?? null,
                    'discount_label'     => $item['discount_label'] ?? null,
                    'discount_type'      => $item['discount_type'] ?? null,
                    'discount_value'     => $item['discount_value'] ?? null,
                    'discount_amount'    => $itemDiscountAmount,
                ]);

                if (!empty($item['menu_item_id'])) {
                    MenuItem::where('id', $item['menu_item_id'])->decrement('quantity', $item['quantity']);
                }
            }

            // 4. Recalculate Totals
            $recalculatedTotal = DB::table('sale_items')->where('sale_id', $sale->id)->sum('final_price');
            $itemDiscountTotal = DB::table('sale_items')->where('sale_id', $sale->id)->sum('discount_amount');

            // The POS may send discount_amount as a DUPLICATE of sc+pwd+diplomat+other.
            // Use the categorized fields as the authoritative source;
            // only count the generic discount for any portion NOT already covered.
            $rawGenericDiscount  = (float) ($data['discount_amount'] ?? 0);
            $scDiscountAmount    = (float) ($data['sc_discount_amount'] ?? 0);
            $pwdDiscountAmount   = (float) ($data['pwd_discount_amount'] ?? 0);
            $diplomatDiscAmount  = (float) ($data['diplomat_discount_amount'] ?? 0);
            $otherDiscountAmount = (float) ($data['other_discount_amount'] ?? 0);

            $totalManualOrderDiscounts = $scDiscountAmount + $pwdDiscountAmount + $diplomatDiscAmount + $otherDiscountAmount;
            $uncategorizedDiscount     = max(0, $rawGenericDiscount - $totalManualOrderDiscounts);

            $finalTotal = max(0, $recalculatedTotal - $itemDiscountTotal - $uncategorizedDiscount - $totalManualOrderDiscounts);

            // SC/PWD VAT treatment (BIR):
            // For SC/PWD-covered items, the sale becomes VAT-exempt.
            // If the stored SC/PWD discount amount is 20% of VAT-exclusive price,
            // then the VAT portion that must also be removed from the customer-pay total is:
            //   lessVat = (discount / 0.20) * 0.12
            //
            // Without this, total_amount becomes too high by the VAT portion of SC/PWD items,
            // causing Z-reading VATable/VAT totals to be overstated.
            $scPwdDisc = $scDiscountAmount + $pwdDiscountAmount;
            if ($scPwdDisc <= 0) {
                // Fallback: derive from item-level labels when order-level amounts are empty
                $scPwdDisc = (float) DB::table('sale_items')
                    ->where('sale_id', $sale->id)
                    ->where(function ($q) {
                        $q->where('discount_label', 'like', '%SENIOR%')
                          ->orWhere('discount_label', 'like', '%PWD%');
                    })
                    ->sum('discount_amount');
            }
            if ($scPwdDisc > 0) {
                // Keep full precision, then round only once at the final amount.
                $lessVat = ($scPwdDisc / 0.20) * 0.12;
                $finalTotal = max(0, round($finalTotal - $lessVat, 2));
            }

            $sale->update(['total_amount' => $finalTotal]);

            // 5. VAT Compliance
            $this->recalculateVat($sale->fresh(), $isVat);

            // 6. Generate Receipt
            Receipt::create([
                'si_number'     => $officialOR,
                'terminal'      => '01',
                'items_count'   => $totalQty,
                'cashier_name'  => $cashierName,
                'total_amount'  => $finalTotal,
                'sale_id'       => $sale->id,
                'branch_id'     => $branchId,
                'brand'         => $branch?->brand ?? 'Lucky Boba Milk Tea',
                'owner_name'    => $branch?->owner_name ?? '',
                'company_name'  => $branch?->company_name ?? '',
                'store_address' => $branch?->store_address ?? '',
                'vat_reg_tin'   => $branch?->vat_reg_tin ?? '',
                'min_number'    => $branch?->min_number ?? '',
                'serial_number' => $branch?->serial_number ?? '',
                'vat_type'      => $branch?->vat_type ?? 'vat',
            ]);

            // 7. Deduct Raw Materials
            $this->deductStockAction->execute($sale);

            DB::commit();

            // 8. Post-Transaction Hooks
            $this->incrementDiscountUsageCount($effectiveDiscountId, $data['pax_discount_ids'] ?? null, $data['items']);
            $this->dashboardService->clearTodayCache($branchId);

            return [
                'status' => 'success',
                'is_new' => true,
                'sale'   => $sale->load('items'),
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ProcessCheckoutAction failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function resolveChargeType(string $paymentMethod, array $items): ?string
    {
        if (in_array($paymentMethod, ['grab', 'food_panda'])) {
            return $paymentMethod;
        }

        foreach ($items as $item) {
            if (!empty($item['charges']['grab']))  return 'grab';
            if (!empty($item['charges']['panda'])) return 'panda';
        }

        return null;
    }

    private function resolveEffectiveDiscountId(array $data): ?int
    {
        if (!empty($data['discount_id'])) return (int) $data['discount_id'];

        $paxIds = array_filter(explode(',', $data['pax_discount_ids'] ?? ''));
        if (count($paxIds) === 1) return (int) $paxIds[0];

        return null;
    }

    /**
     * Correctly calculates VAT components for BIR compliance.
     *
     * ── GOLDEN RULE ──────────────────────────────────────────────────────────
     *
     *   vatable_sales + vat_amount + vat_exempt_sales ≡ total_amount
     *
     * total_amount is anchored as the customer-paid amount (post all discounts).
     * We split it into a VATable portion and a VAT-exempt portion.
     *
     * ── HOW SC/PWD DISCOUNTS WORK (BIR rules) ──────────────────────────────
     * Senior Citizen (SC) and PWD discounts:
     *   - Discount = 20% of the VAT-exclusive menu price
     *   - The discounted sale is entirely VAT-EXEMPT
     *   - Customer pays: (menu_price / 1.12) × 0.80
     *
     * From the stored discount amount we can derive what the customer paid:
     *   pre_vat_full_price = discount / 0.20
     *   customer_pays      = pre_vat_full_price × 0.80 = discount × 4
     *
     * The remaining portion of total_amount (non SC/PWD) is VAT-inclusive.
     */
    private function recalculateVat(Sale $sale, bool $isVat): void
    {
        $totalAmount = (float) $sale->total_amount;

        if (!$isVat || $totalAmount <= 0) {
            $sale->update([
                'vatable_sales'    => 0,
                'vat_amount'       => 0,
                'vat_exempt_sales' => 0,
            ]);
            return;
        }

        // Preserve any VAT-exempt sales already computed upstream (e.g. items marked VAT-exempt),
        // then layer in SC/PWD-derived VAT-exempt amounts as needed.
        $baseVatExemptSales = max(0.0, (float) ($sale->vat_exempt_sales ?? 0));

        // ── Determine the SC/PWD discount total ─────────────────────────────
        $scDiscount  = (float) ($sale->sc_discount_amount  ?? 0);
        $pwdDiscount = (float) ($sale->pwd_discount_amount ?? 0);
        $totalScPwd  = $scDiscount + $pwdDiscount;

        // Fallback: check item-level labels if order-level amounts are zero
        if ($totalScPwd <= 0) {
            $sale->load('items');
            foreach ($sale->items as $item) {
                $label = strtoupper($item->discount_label ?? '');
                if (str_contains($label, 'SENIOR') || str_contains($label, 'PWD')) {
                    $totalScPwd += (float) $item->discount_amount;
                }
            }
        }

        // ── Compute SC/PWD VAT-exempt portion (customer-paid amount) ────────
        $scPwdVatExemptSales = 0.0;
        if ($totalScPwd > 0) {
            // discount = 20% of pre-VAT → customer pays 80% of pre-VAT
            $scPwdVatExemptSales = round($totalScPwd / 0.20 * 0.80, 2);
            // Safety: cannot exceed what was actually collected
            $scPwdVatExemptSales = min($scPwdVatExemptSales, $totalAmount);
        }

        // If upstream already included SC/PWD in vat_exempt_sales, avoid double-counting.
        // Heuristic: when the stored base is approximately equal/greater than derived SC/PWD exempt,
        // assume it's already included.
        $vatExemptSales = $baseVatExemptSales;
        if ($scPwdVatExemptSales > 0) {
            if ($baseVatExemptSales + 0.02 < $scPwdVatExemptSales) {
                $vatExemptSales = $baseVatExemptSales + $scPwdVatExemptSales;
            } else {
                $vatExemptSales = max($baseVatExemptSales, $scPwdVatExemptSales);
            }
        }

        // Safety: cannot exceed what was actually collected
        $vatExemptSales = min(round($vatExemptSales, 2), $totalAmount);

        // ── The rest is VATable (inclusive of 12% VAT) ──────────────────────
        $vatableGross  = round($totalAmount - $vatExemptSales, 2);
        $vatableSales  = round($vatableGross / 1.12, 2);
        $vatAmount     = round($vatableGross - $vatableSales, 2);

        // ── Enforce golden rule: components must sum exactly to total_amount
        $residual = round($totalAmount - ($vatableSales + $vatAmount + $vatExemptSales), 2);
        if (abs($residual) > 0 && abs($residual) <= 0.05) {
            // Deterministic centavo allocation:
            // - For fully VAT-exempt scenarios, keep vatable at 0 and absorb residual in exempt.
            // - Otherwise, absorb residual in VAT amount (not vatable base) to avoid base drift.
            $nearFullyExempt = round($totalAmount - $vatExemptSales, 2) <= 0.01;
            if ($nearFullyExempt) {
                $vatExemptSales = round($vatExemptSales + $residual, 2);
            } else {
                $vatAmount = round($vatAmount + $residual, 2);
            }
        }

        $sale->update([
            'vatable_sales'    => $vatableSales,
            'vat_amount'       => $vatAmount,
            'vat_exempt_sales' => $vatExemptSales,
        ]);
    }

    private function incrementDiscountUsageCount(?int $effectiveDiscountId, ?string $paxDiscountIds, array $items): void
    {
        $discountIds = collect();
        if ($effectiveDiscountId) $discountIds->push($effectiveDiscountId);
        
        if ($paxDiscountIds) {
            $paxIds = array_filter(explode(',', $paxDiscountIds));
            foreach ($paxIds as $id) $discountIds->push((int) $id);
        }

        foreach ($items as $item) {
            if (!empty($item['discount_id'])) {
                $discountIds->push((int) $item['discount_id']);
            }
        }

        $uniqueIds = $discountIds->filter()->unique();

        if ($uniqueIds->isNotEmpty()) {
            Discount::whereIn('id', $uniqueIds)->increment('used_count');
        }
    }
}