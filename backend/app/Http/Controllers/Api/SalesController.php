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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'si_number'              => 'required|string',
            'items'                  => 'required|array|min:1',
            'items.*.menu_item_id'   => 'nullable|exists:menu_items,id',
            'items.*.bundle_id'      => 'nullable|exists:bundles,id',
            'items.*.name'           => 'required|string',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.unit_price'     => 'required|numeric|min:0',
            'items.*.total_price'    => 'required|numeric|min:0',
            'items.*.size'           => 'nullable|string',
            'items.*.cup_size_label' => 'nullable|string',
            'items.*.sugar_level'    => 'nullable|string',
            'items.*.options'        => 'nullable|array',
            'items.*.add_ons'        => 'nullable|array',
            'items.*.remarks'        => 'nullable|string',
            'items.*.charges'        => 'nullable|array',
            'items.*.charges.grab'   => 'nullable|boolean',
            'items.*.charges.panda'  => 'nullable|boolean',
            'items.*.discount_id'    => 'nullable|integer',
            'items.*.discount_label' => 'nullable|string',
            'items.*.discount_type'  => 'nullable|string',
            'items.*.discount_value' => 'nullable|numeric|min:0',
            'subtotal'               => 'required|numeric|min:0',
            'total'                  => 'required|numeric|min:0',
            'cashier_name'           => 'nullable|string',
            'payment_method'         => 'nullable|string',
            'reference_number'       => 'nullable|string',
            'discount_id'            => 'nullable|exists:discounts,id',
            'discount_amount'        => 'nullable|numeric|min:0',
            'sc_discount_amount'     => 'nullable|numeric|min:0',
            'pwd_discount_amount'    => 'nullable|numeric|min:0',
            'diplomat_discount_amount' => 'nullable|numeric|min:0',
            'other_discount_amount'  => 'nullable|numeric|min:0',
            'discount_remarks'       => 'nullable|string',
            'vatable_sales'          => 'required|numeric',
            'vat_amount'             => 'required|numeric',
            'vat_type'               => 'nullable|in:vat,non_vat',
            'customer_name'          => 'nullable|string',
            'cash_tendered'          => 'nullable|numeric|min:0',
            'pax_discount_ids'       => 'nullable|string',
            'pax_senior'             => 'nullable|integer|min:0',
            'pax_pwd'                => 'nullable|integer|min:0',
            'senior_id'              => 'nullable|string',
            'pwd_id'                 => 'nullable|string',
        ]);

        $user        = auth('sanctum')->user();
        $cashierName = $request->input('cashier_name') ?? ($user ? $user->name : 'System Admin');
        $userId      = $user?->id;
        $branchId    = $user?->branch_id;
        $officialOR  = $validated['si_number'];

            $existing = Sale::with('items')
        ->where('invoice_number', $validated['si_number'])
        ->where('branch_id', auth('sanctum')->user()?->branch_id)
        ->first();

        if ($existing) {
            return response()->json([
                'status'    => 'success',
                'si_number' => $existing->invoice_number,
                'sale'      => $existing->makeVisible([
                    'pax_senior','pax_pwd','senior_id','pwd_id',
                    'sc_discount_amount','pwd_discount_amount',
                    'diplomat_discount_amount','other_discount_amount',
                ])->load('items'),
            ], 200); // 200 not 201 — it already existed
        }

        try {
            DB::beginTransaction();

            // ── Determine order-level charge type ─────────────────────────────
            $paymentMethod = $request->input('payment_method', 'cash');
            $chargeType    = $this->resolveChargeType($validated['items'], $paymentMethod);

            // ── Resolve effective discount_id ──────────────────────────────────
            $effectiveDiscountId = $this->resolveEffectiveDiscountId($request);

            // ── Use frontend pre-calculated split amounts ──────────────────────
            $scDiscountAmount       = (float) $request->input('sc_discount_amount',       0);
            $pwdDiscountAmount      = (float) $request->input('pwd_discount_amount',       0);
            $diplomatDiscountAmount = (float) $request->input('diplomat_discount_amount',  0);
            $otherDiscountAmount    = (float) $request->input('other_discount_amount',     0);

            // ── Determine VAT type ────────────────────────────────────────────
            $branch = Branch::find($branchId);
            $isVat  = ($branch?->vat_type ?? 'vat') !== 'non_vat';

            // ── 1. Create Sale (vatable_sales / vat_amount placeholder — recalculated below) ──
            $sale = Sale::create([
                'user_id'                  => $userId,
                'branch_id'                => $branchId,
                'total_amount'             => 0,
                'invoice_number'           => $officialOR,
                'status'                   => 'completed',
                'payment_method'           => $request->input('payment_method', 'cash'),
                'reference_number'         => $request->input('reference_number'),
                'charge_type'              => $chargeType,
                'discount_id'              => $effectiveDiscountId,
                'discount_amount'          => (float) $request->input('discount_amount', 0),
                'sc_discount_amount'       => $scDiscountAmount,
                'pwd_discount_amount'      => $pwdDiscountAmount,
                'diplomat_discount_amount' => $diplomatDiscountAmount,
                'other_discount_amount'    => $otherDiscountAmount,
                'discount_remarks'         => $validated['discount_remarks'] ?? null,
                'vatable_sales'            => 0, // recalculated after final total is known
                'vat_amount'               => 0, // recalculated after final total is known
                'vat_type'                 => $request->input('vat_type', 'vat'),
                'customer_name'            => $validated['customer_name'] ?? null,
                'is_synced'                => false,
                'cash_tendered'            => (float) $request->input('cash_tendered', 0),
                'pax_senior'               => $request->input('pax_senior'),
                'pax_pwd'                  => $request->input('pax_pwd'),
                'senior_id'                => $request->input('senior_id'),
                'pwd_id'                   => $request->input('pwd_id'),
                'pax_discount_ids'         => $request->input('pax_discount_ids'),
            ]);

            // ── 2. Create Sale Items ───────────────────────────────────────────
            $totalQty = 0;

            foreach ($validated['items'] as $item) {
                $hasCharge  = !empty($item['charges']['grab']) || !empty($item['charges']['panda']);
                $basePrice  = (float) $item['unit_price'];
                $totalPrice = (float) $item['total_price'];

                $surcharge  = $hasCharge
                    ? round($totalPrice - ($basePrice * $item['quantity']), 2)
                    : 0;

                $finalPrice = $totalPrice;
                $totalQty  += $item['quantity'];

                $itemDiscountAmount = 0;
                if (!empty($item['discount_type']) && isset($item['discount_value'])) {
                    $itemDiscountAmount = $item['discount_type'] === 'percent'
                        ? round($basePrice * $item['quantity'] * ($item['discount_value'] / 100), 2)
                        : round((float) $item['discount_value'] * $item['quantity'], 2);
                }

                SaleItem::create([
                    'sale_id'           => $sale->id,
                    'menu_item_id'      => $item['menu_item_id']  ?? null,
                    'bundle_id'         => $item['bundle_id']     ?? null,
                    'product_name'      => $item['name'],
                    'quantity'          => $item['quantity'],
                    'price'             => $basePrice,
                    'final_price'       => $finalPrice,
                    'size'              => $item['size']           ?? null,
                    'cup_size_label'    => $item['cup_size_label'] ?? null,
                    'sugar_level'       => $item['sugar_level']    ?? null,
                    'options'           => $item['options']        ?? null,
                    'add_ons'           => $item['add_ons']        ?? null,
                    'bundle_components' => isset($item['bundle_components'])
                                            ? json_encode($item['bundle_components'])
                                            : null,
                    'charge_type'       => $hasCharge
                                            ? ($item['charges']['grab'] ? 'grab' : 'panda')
                                            : null,
                    'surcharge'         => $surcharge,
                    'discount_id'       => $item['discount_id']    ?? null,
                    'discount_label'    => $item['discount_label'] ?? null,
                    'discount_type'     => $item['discount_type']  ?? null,
                    'discount_value'    => $item['discount_value'] ?? null,
                    'discount_amount'   => $itemDiscountAmount,
                ]);

                if (!empty($item['menu_item_id'])) {
                    $menuItem = MenuItem::where('id', $item['menu_item_id'])->lockForUpdate()->first();
                    if ($menuItem) {
                        $menuItem->decrement('quantity', $item['quantity']);
                    }
                }
            }

            // ── 3. Recalculate total from saved items ──────────────────────────
            $recalculatedTotal = DB::table('sale_items')
                ->where('sale_id', $sale->id)
                ->sum('final_price');

            $itemDiscountTotal = DB::table('sale_items')
                ->where('sale_id', $sale->id)
                ->sum('discount_amount');

            // ✅ Use the frontend-computed amtDue (already accounts for SC/PWD)
            $finalTotal = (float) $request->input('total', 0);

            // Fallback: only recompute if total not provided
            if ($finalTotal <= 0) {
                $discountApplied = (float) $request->input('discount_amount', 0);
                $finalTotal = max(0, $recalculatedTotal - $itemDiscountTotal - $discountApplied);
            }

            $sale->update(['total_amount' => $finalTotal]);

            // ── Recompute VAT from final total (BIR-compliant, server-side) ───
            $this->recalculateVat($sale, $finalTotal, $isVat, $scDiscountAmount, $pwdDiscountAmount);

            // ── 4. Create Receipt ──────────────────────────────────────────────
            Receipt::create([
                'si_number'     => $officialOR,
                'terminal'      => '01',
                'items_count'   => $totalQty,
                'cashier_name'  => $cashierName,
                'total_amount'  => $finalTotal,
                'sale_id'       => $sale->id,
                'branch_id'     => $branchId,
                'brand'         => $branch?->brand         ?? 'Lucky Boba Milk Tea',
                'owner_name'    => $branch?->owner_name    ?? '',
                'company_name'  => $branch?->company_name  ?? '',
                'store_address' => $branch?->store_address ?? '',
                'vat_reg_tin'   => $branch?->vat_reg_tin   ?? '',
                'min_number'    => $branch?->min_number    ?? '',
                'serial_number' => $branch?->serial_number ?? '',
                'vat_type'      => $branch?->vat_type      ?? 'vat',
            ]);

            // ── 5. Deduct Raw Materials ────────────────────────────────────────
            app(SaleObserver::class)->deductStock($sale);

            DB::commit();

            // ── 6. Increment discount used_count ──────────────────────────────
            $this->incrementDiscountUsage($sale, $validated['items']);

            $this->dashboardService->clearTodayCache($sale->branch_id);

            return response()->json([
                'status'    => 'success',
                'si_number' => $officialOR,
                'sale'      => $sale->makeVisible([
                    'pax_senior','pax_pwd','senior_id','pwd_id',
                    'sc_discount_amount','pwd_discount_amount','diplomat_discount_amount','other_discount_amount'
                ])->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale creation failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function resolveChargeType(array $items, string $paymentMethod): ?string
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

    private function resolveEffectiveDiscountId(Request $request): ?int
    {
        $id = $request->input('discount_id');
        if ($id) return (int) $id;

        $paxIds = array_filter(explode(',', $request->input('pax_discount_ids', '')));
        if (count($paxIds) === 1) {
            return (int) $paxIds[0];
        }

        return null;
    }

    private function recalculateVat(Sale $sale, float $finalTotal, bool $isVat, float $scDiscount, float $pwdDiscount): void
    {
        $scPwdTotal   = $scDiscount + $pwdDiscount;
        $vatableGross = $finalTotal - $scPwdTotal; // amount subject to VAT
        $vatableSales = $isVat ? round($vatableGross / 1.12, 2) : 0;
        $vatAmount    = $isVat ? round($vatableGross - $vatableSales, 2) : 0;

        $sale->update([
            'vatable_sales' => $vatableSales,
            'vat_amount'    => $vatAmount,
        ]);
    }

    private function incrementDiscountUsage(Sale $sale, array $items): void
    {
        $discountIds = collect();

        // Header level
        if ($sale->discount_id) {
            $discountIds->push($sale->discount_id);
        }

        // Pax discounts
        if ($sale->pax_discount_ids) {
            $paxIds = array_filter(explode(',', $sale->pax_discount_ids));
            foreach ($paxIds as $id) {
                $discountIds->push((int) $id);
            }
        }

        // Item level
        foreach ($items as $item) {
            if (!empty($item['discount_id'])) {
                $discountIds->push((int) $item['discount_id']);
            }
        }

        $uniqueIds = $discountIds->filter()->unique();

        if ($uniqueIds->isNotEmpty()) {
            \App\Models\Discount::whereIn('id', $uniqueIds)->increment('used_count');
        }
    }

    public function index()
    {
        $user  = auth('sanctum')->user();
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
                return response()->json(['message' => 'Unauthorized — Supervisor can only void sales from their own branch.'], 403);
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
                'status'              => 'cancelled',
                'cancellation_reason' => $request->reason,
                'cancelled_at'        => now(),
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
}