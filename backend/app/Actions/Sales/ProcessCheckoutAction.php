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
                    'price'              => $basePrice,
                    'final_price'        => $totalPrice, // Equivalent to old logic
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

                // Manage product-level quantity deduction
                if (!empty($item['menu_item_id'])) {
                    MenuItem::where('id', $item['menu_item_id'])->decrement('quantity', $item['quantity']);
                }
            }

            // 4. Recalculate Totals
            $recalculatedTotal = DB::table('sale_items')->where('sale_id', $sale->id)->sum('final_price');
            $itemDiscountTotal = DB::table('sale_items')->where('sale_id', $sale->id)->sum('discount_amount');
            
            // Collect all order-level and manual discounts
            $orderDiscount       = (float) ($data['discount_amount'] ?? 0);
            $scDiscountAmount    = (float) ($data['sc_discount_amount'] ?? 0);
            $pwdDiscountAmount   = (float) ($data['pwd_discount_amount'] ?? 0);
            $diplomatDiscAmount  = (float) ($data['diplomat_discount_amount'] ?? 0);
            $otherDiscountAmount = (float) ($data['other_discount_amount'] ?? 0);
            
            $totalManualOrderDiscounts = $scDiscountAmount + $pwdDiscountAmount + $diplomatDiscAmount + $otherDiscountAmount;
            
            // finalTotal should be the Sum of Item Prices minus all discounts
            $finalTotal = max(0, $recalculatedTotal - $itemDiscountTotal - $orderDiscount - $totalManualOrderDiscounts);

            $sale->update(['total_amount' => $finalTotal]);

            // 5. VAT Compliance (Corrected to handle item-level exempt status)
            $this->recalculateVat($sale, $isVat);

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

            // 7. Deduct Raw Materials (Replaces explicit Observer call)
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
     * Refactored to correctly calculate VAT components by distinguishing between
     * VATable and VAT-exempt portions based on line items.
     */
    private function recalculateVat(Sale $sale, bool $isVat): void
    {
        $sale->load('items');
        
        $vatableGross = 0;
        $vatExemptSales = 0;

        foreach ($sale->items as $item) {
            $isItemExempt = $item->discount_label && (
                stripos($item->discount_label, 'SENIOR') !== false ||
                stripos($item->discount_label, 'PWD') !== false ||
                stripos($item->discount_label, 'DIPLOMAT') !== false
            );

            if ($isItemExempt) {
                // For SC/PWD/Diplomat, the portion is VAT exempt.
                // We derive the exempt base by removing the 12% VAT already included in menu price.
                $vatExemptSales += round($item->final_price / 1.12, 2);
            } else {
                $vatableGross += $item->final_price;
            }
        }

        // Subtract order-level discounts from vatableGross to get true taxable base
        // Note: SC/PWD/Diplomat order-level discounts are already factored into vat_exempt_sales logic usually,
        // but for general promos (Other/General Discount), they must reduce the vatable base.
        $orderDiscounts = (float)($sale->discount_amount ?? 0) + (float)($sale->other_discount_amount ?? 0);
        
        // Ensure vatableGross doesn't go below zero
        $vatableGross = max(0, $vatableGross - $orderDiscounts);

        $vatableSales = $isVat ? round($vatableGross / 1.12, 2) : 0;
        $vatAmount    = $isVat ? round($vatableGross - $vatableSales, 2) : 0;

        $sale->update([
            'vatable_sales'    => $vatableSales,
            'vat_amount'       => $vatAmount,
            'vat_exempt_sales' => round($vatExemptSales, 2),
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
