<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
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

    /**
     * Store a newly created sale in storage.
     */
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
            'discount_remarks'       => 'nullable|string',
            'vatable_sales'          => 'required|numeric',
            'vat_amount'             => 'required|numeric',
            'customer_name'          => 'nullable|string',
        ]);

        $user        = auth('sanctum')->user();
        $cashierName = $request->input('cashier_name') ?? ($user ? $user->name : 'System Admin');
        $userId      = $user?->id;
        $branchId    = $user?->branch_id;
        $officialOR  = $validated['si_number'];

        try {
            DB::beginTransaction();

            // ── Determine order-level charge type ────────────────────────────────
            $chargeType = null;
            foreach ($validated['items'] as $item) {
                if (!empty($item['charges']['grab']))  { $chargeType = 'grab';  break; }
                if (!empty($item['charges']['panda'])) { $chargeType = 'panda'; break; }
            }

            // ── 1. Create Sale ────────────────────────────────────────────────────
            $sale = Sale::create([
                'user_id'          => $userId,
                'branch_id'        => $branchId,
                'total_amount'     => 0,
                'invoice_number'   => $officialOR,
                'status'           => 'completed',
                'payment_method'   => $request->input('payment_method', 'cash'),
                'reference_number' => $request->input('reference_number'),
                'charge_type'      => $chargeType,
                'discount_id'      => $request->input('discount_id'),
                'discount_amount'  => (float) $request->input('discount_amount', 0),
                'discount_remarks' => $validated['discount_remarks'] ?? null,
                'vatable_sales'    => $validated['vatable_sales'],
                'vat_amount'       => $validated['vat_amount'],
                'customer_name'    => $validated['customer_name'] ?? null,
                'is_synced'        => false,
            ]);

            // ── 2. Create Sale Items ──────────────────────────────────────────────
            $totalQty = 0;

            foreach ($validated['items'] as $item) {
                $hasCharge  = !empty($item['charges']['grab']) || !empty($item['charges']['panda']);
                $surcharge  = $hasCharge ? 30 * $item['quantity'] : 0;
                $basePrice  = (float) $item['unit_price'];
                $finalPrice = ($basePrice * $item['quantity']) + $surcharge;

                $totalQty += $item['quantity'];

                // Compute item-level discount amount in pesos
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
                    'sugar_level'       => $item['sugar_level']   ?? null,
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

                // Decrement stock for regular menu items only
                if (!empty($item['menu_item_id'])) {
                    $menuItem = MenuItem::find($item['menu_item_id']);
                    if ($menuItem) {
                        $menuItem->decrement('quantity', $item['quantity']);
                    }
                }
            }

            // ── 3. Recalculate total from saved items ─────────────────────────────
            $recalculatedTotal = DB::table('sale_items')
                ->where('sale_id', $sale->id)
                ->sum('final_price');

            $discountApplied = (float) $request->input('discount_amount', 0);
            $finalTotal      = max(0, $recalculatedTotal - $discountApplied);

            $sale->update(['total_amount' => $finalTotal]);

            // ── 4. Create Receipt ─────────────────────────────────────────────────
            Receipt::create([
                'si_number'    => $officialOR,
                'terminal'     => '01',
                'items_count'  => $totalQty,
                'cashier_name' => $cashierName,
                'total_amount' => $recalculatedTotal,
                'sale_id'      => $sale->id,
                'branch_id'    => $branchId,
            ]);

            // ── 5. Deduct Raw Materials ───────────────────────────────────────────
            app(SaleObserver::class)->deductStock($sale);

            DB::commit();
            $this->dashboardService->clearTodayCache($sale->branch_id);

            return response()->json([
                'status'    => 'success',
                'si_number' => $officialOR,
                'sale'      => $sale->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale creation failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * List all sales.
     */
    public function index()
    {
        $user  = auth('sanctum')->user();
        $query = Sale::with('items', 'user')->latest();

        if ($user && !in_array($user->role, ['superadmin', 'admin'])) {
            $query->where('branch_id', $user->branch_id);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Void/Cancel a sale.
     */
    public function cancel(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $sale = Sale::with('items')->findOrFail($id);

            if ($sale->status === 'cancelled') {
                return response()->json(['message' => 'Sale already cancelled'], 400);
            }

            // ── Restore MenuItem quantities ───────────────────────────────────────
            foreach ($sale->items as $item) {
                $menuItem = MenuItem::find($item->menu_item_id);
                if ($menuItem) {
                    $menuItem->increment('quantity', $item->quantity);
                } else {
                    Log::warning("Inventory restore failed for sale #{$sale->invoice_number}: MenuItem ID {$item->menu_item_id} not found.");
                }
            }

            // ── Update Sale Status ────────────────────────────────────────────────
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