<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
use App\Models\Branch;        // ✅
use App\Models\MenuItem;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Observers\SaleObserver;
use App\Services\DashboardService;
use App\Http\Requests\Api\StoreSaleRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function store(StoreSaleRequest $request)
    {
        $validated = $request->validated();

        $user = auth('sanctum')->user();
        $cashierName = $request->input('cashier_name') ?? ($user ? $user->name : 'System Admin');
        $userId = $user?->id;
        $branchId = $user?->branch_id;
        $officialOR = $validated['si_number'];

        $existing = $this->checkExistingSale($officialOR);

        if ($existing) {
            return response()->json([
                'status' => 'success',
                'si_number' => $existing->invoice_number,
                'sale' => $existing->makeVisible([
                    'pax_senior',
                    'pax_pwd',
                    'senior_id',
                    'pwd_id',
                    'sc_discount_amount',
                    'pwd_discount_amount',
                    'diplomat_discount_amount',
                    'other_discount_amount',
                ])->load('items'),
            ], 200);
        }

        try {
            DB::beginTransaction();

            $chargeType = $this->resolveChargeType($request, $validated['items']);
            $effectiveDiscountId = $this->resolveEffectiveDiscountId($request);

            $branch = Branch::find($branchId);
            $isVat = ($branch?->vat_type ?? 'vat') !== 'non_vat';

            $sale = Sale::create([
                'user_id' => $userId,
                'branch_id' => $branchId,
                'total_amount' => 0,
                'invoice_number' => $officialOR,
                'status' => 'completed',
                'payment_method' => $request->input('payment_method', 'cash'),
                'reference_number' => $request->input('reference_number'),
                'charge_type' => $chargeType,
                'discount_id' => $effectiveDiscountId,
                'discount_amount' => (float) $request->input('discount_amount', 0),
                'sc_discount_amount' => (float) $request->input('sc_discount_amount', 0),
                'pwd_discount_amount' => (float) $request->input('pwd_discount_amount', 0),
                'diplomat_discount_amount' => (float) $request->input('diplomat_discount_amount', 0),
                'other_discount_amount' => (float) $request->input('other_discount_amount', 0),
                'discount_remarks' => $validated['discount_remarks'] ?? null,
                'vatable_sales' => 0,
                'vat_amount' => 0,
                'vat_exempt_sales' => (float) $request->input('vat_exempt_sales', 0),
                'vat_type' => $request->input('vat_type', 'vat'),
                'customer_name' => $validated['customer_name'] ?? null,
                'is_synced' => false,
                'cash_tendered' => (float) $request->input('cash_tendered', 0),
                'pax_senior' => $request->input('pax_senior'),
                'pax_pwd' => $request->input('pax_pwd'),
                'senior_id' => $request->input('senior_id'),
                'pwd_id' => $request->input('pwd_id'),
                'pax_discount_ids' => $request->input('pax_discount_ids'),
            ]);

            $totalQty = $this->processSaleItems($sale, $validated['items']);

            $this->recalculateSaleFinancials($sale, $request, $isVat);

            $this->createReceipt($sale, $officialOR, $totalQty, $cashierName, $branch);

            app(SaleObserver::class)->deductStock($sale);

            DB::commit();

            $this->incrementDiscountUsageCount($effectiveDiscountId, $request->input('pax_discount_ids'), $validated['items']);

            $this->dashboardService->clearTodayCache($sale->branch_id);

            return response()->json([
                'status' => 'success',
                'si_number' => $officialOR,
                'sale' => $sale->makeVisible([
                    'pax_senior',
                    'pax_pwd',
                    'senior_id',
                    'pwd_id',
                    'sc_discount_amount',
                    'pwd_discount_amount',
                    'diplomat_discount_amount',
                    'other_discount_amount'
                ])->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale creation failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        $user = auth('sanctum')->user();
        $query = Sale::with('items', 'user')->latest();

        if ($user && !in_array($user->role, ['superadmin', 'admin'])) {
            $query->where('branch_id', $user->branch_id);
        }

        return response()->json($query->paginate(20));
    }

    public function cancel(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $sale = Sale::with('items')->findOrFail($id);
            $user = $request->user();

            if ($user->role === 'supervisor' && $sale->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($sale->status === 'cancelled') {
                return response()->json(['message' => 'Sale already cancelled'], 400);
            }

            foreach ($sale->items as $item) {
                $menuItem = MenuItem::find($item->menu_item_id);
                if ($menuItem) {
                    $menuItem->increment('quantity', $item->quantity);
                } else {
                    Log::warning("Inventory restore failed for sale #{$sale->invoice_number}: MenuItem ID {$item->menu_item_id} not found.");
                }
            }

            $sale->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->reason,
                'cancelled_at' => now(),
            ]);

            DB::commit();
            $this->dashboardService->clearTodayCache($sale->branch_id);

            AuditHelper::log('void', "Voided transaction #{$sale->id}", "Amount: {$sale->total_amount}");

            return response()->json(['status' => 'success', 'message' => 'Voided successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale cancellation failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    private function checkExistingSale(string $siNumber)
    {
        return Sale::with('items')
            ->where('invoice_number', $siNumber)
            ->where('branch_id', auth('sanctum')->user()?->branch_id)
            ->first();
    }

    private function resolveChargeType(Request $request, array $items): ?string
    {
        $paymentMethod = $request->input('payment_method', 'cash');

        return match (true) {
            in_array($paymentMethod, ['grab', 'food_panda']) => $paymentMethod,
            default => (function () use ($items) {
                    foreach ($items as $item) {
                        if (!empty($item['charges']['grab']))
                            return 'grab';
                        if (!empty($item['charges']['panda']))
                            return 'panda';
                    }
                    return null;
                })(),
        };
    }

    private function resolveEffectiveDiscountId(Request $request): ?int
    {
        $effectiveDiscountId = $request->input('discount_id');
        $paxIds = array_filter(explode(',', $request->input('pax_discount_ids', '')));

        if (!$effectiveDiscountId && count($paxIds) === 1) {
            return (int) $paxIds[0];
        }

        return $effectiveDiscountId ? (int) $effectiveDiscountId : null;
    }

    private function processSaleItems(Sale $sale, array $items): int
    {
        $totalQty = 0;

        foreach ($items as $item) {
            $hasCharge = !empty($item['charges']['grab']) || !empty($item['charges']['panda']);
            $basePrice = (float) $item['unit_price'];
            $totalPrice = (float) $item['total_price'];

            $surcharge = $hasCharge
                ? round($totalPrice - ($basePrice * $item['quantity']), 2)
                : 0;

            $totalQty += $item['quantity'];

            $itemDiscountAmount = 0;
            if (!empty($item['discount_type']) && isset($item['discount_value'])) {
                $itemDiscountAmount = $item['discount_type'] === 'percent'
                    ? round($basePrice * $item['quantity'] * ($item['discount_value'] / 100), 2)
                    : round((float) $item['discount_value'] * $item['quantity'], 2);
            }

            SaleItem::create([
                'sale_id' => $sale->id,
                'menu_item_id' => $item['menu_item_id'] ?? null,
                'bundle_id' => $item['bundle_id'] ?? null,
                'product_name' => $item['name'],
                'quantity' => $item['quantity'],
                'price' => $basePrice,
                'final_price' => $totalPrice,
                'size' => $item['size'] ?? null,
                'cup_size_label' => $item['cup_size_label'] ?? null,
                'sugar_level' => $item['sugar_level'] ?? null,
                'options' => $item['options'] ?? null,
                'add_ons' => $item['add_ons'] ?? null,
                'bundle_components' => isset($item['bundle_components'])
                    ? json_encode($item['bundle_components'])
                    : null,
                'charge_type' => $hasCharge
                    ? ($item['charges']['grab'] ? 'grab' : 'panda')
                    : null,
                'surcharge' => $surcharge,
                'discount_id' => $item['discount_id'] ?? null,
                'discount_label' => $item['discount_label'] ?? null,
                'discount_type' => $item['discount_type'] ?? null,
                'discount_value' => $item['discount_value'] ?? null,
                'discount_amount' => $itemDiscountAmount,
            ]);

            if (!empty($item['menu_item_id'])) {
                $menuItem = MenuItem::where('id', $item['menu_item_id'])->lockForUpdate()->first();
                if ($menuItem) {
                    $menuItem->decrement('quantity', $item['quantity']);
                }
            }
        }

        return $totalQty;
    }

    public function recalculateSaleFinancials(Sale $sale, Request $request, bool $isVat): void
    {
        $recalculatedTotal = DB::table('sale_items')
            ->where('sale_id', $sale->id)
            ->sum('final_price');

        $itemDiscountTotal = DB::table('sale_items')
            ->where('sale_id', $sale->id)
            ->sum('discount_amount');

        $finalTotal = (float) $request->input('total', 0);

        if ($finalTotal <= 0) {
            $discountApplied = (float) $request->input('discount_amount', 0);
            $finalTotal = max(0, $recalculatedTotal - $itemDiscountTotal - $discountApplied);
        }

        $sale->update(['total_amount' => $finalTotal]);

        $scDiscountAmount = (float) $request->input('sc_discount_amount', 0);
        $pwdDiscountAmount = (float) $request->input('pwd_discount_amount', 0);
        
        // AUTO-CALC VAT EXEMPT: In PH, SC/PWD discount is 20% of the VAT-exempt base.
        // Therefore Base = Discount / 0.20. We use the stored vat_exempt_sales as the 
        // source of truth from the frontend, but we fallback/verify here.
        $vatExemptSales = (float) $request->input('vat_exempt_sales', 0);
        if ($vatExemptSales <= 0 && ($scDiscountAmount > 0 || $pwdDiscountAmount > 0)) {
            $vatExemptSales = round(($scDiscountAmount + $pwdDiscountAmount) / 0.20, 2);
        }

        // Calculate vatable portion by removing the exempt net part from the total due
        // and ensuring we don't double-charge VAT on the tax itself.
        // The finalTotal is (Vatable + VAT + Exempt). 
        // We need to resolve: Vatable + (Vatable * 0.12) = finalTotal - Exempt
        $vatableGross = max(0, $finalTotal - $vatExemptSales);
        $vatableSales = $isVat ? round($vatableGross / 1.12, 2) : 0;
        $vatAmount = $isVat ? round($vatableGross - $vatableSales, 2) : 0;

        $sale->update([
            'vatable_sales' => $vatableSales,
            'vat_amount' => $vatAmount,
            'vat_exempt_sales' => $vatExemptSales,
        ]);
    }

    private function createReceipt(Sale $sale, string $officialOR, int $totalQty, string $cashierName, ?Branch $branch): void
    {
        Receipt::create([
            'si_number' => $officialOR,
            'terminal' => '01',
            'items_count' => $totalQty,
            'cashier_name' => $cashierName,
            'total_amount' => $sale->total_amount,
            'sale_id' => $sale->id,
            'branch_id' => $sale->branch_id,
            'brand' => $branch?->brand ?? 'Lucky Boba Milk Tea',
            'owner_name' => $branch?->owner_name ?? '',
            'company_name' => $branch?->company_name ?? '',
            'store_address' => $branch?->store_address ?? '',
            'vat_reg_tin' => $branch?->vat_reg_tin ?? '',
            'min_number' => $branch?->min_number ?? '',
            'serial_number' => $branch?->serial_number ?? '',
            'vat_type' => $branch?->vat_type ?? 'vat',
        ]);
    }

    private function incrementDiscountUsageCount(?int $effectiveDiscountId, ?string $paxDiscountIds, array $items): void
    {
        if ($effectiveDiscountId) {
            \App\Models\Discount::where('id', $effectiveDiscountId)->increment('used_count');
        }

        if ($paxDiscountIds) {
            $allPaxIds = array_filter(explode(',', $paxDiscountIds));
            foreach ($allPaxIds as $paxId) {
                if ((int) $paxId !== (int) $effectiveDiscountId) {
                    \App\Models\Discount::where('id', (int) $paxId)->increment('used_count');
                }
            }
        }

        $itemDiscountIds = collect($items)->pluck('discount_id')->filter()->unique();
        foreach ($itemDiscountIds as $discountId) {
            \App\Models\Discount::where('id', $discountId)->increment('used_count');
        }
    }
}