<?php

namespace App\Http\Controllers\Api;

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
            'si_number'                => 'required|string',
            'items'                    => 'required|array|min:1',
            'items.*.menu_item_id'     => 'required|exists:menu_items,id',
            'items.*.name'             => 'required|string',
            'items.*.quantity'         => 'required|integer|min:1',
            'items.*.unit_price'       => 'required|numeric|min:0',
            'items.*.total_price'      => 'required|numeric|min:0',
            'items.*.size'             => 'nullable|string',
            'items.*.sugar_level'      => 'nullable|string',
            'items.*.options'          => 'nullable|array',
            'items.*.add_ons'          => 'nullable|array',
            'items.*.remarks'          => 'nullable|string',
            'items.*.charges'          => 'nullable|array',
            'subtotal'                 => 'required|numeric|min:0',
            'total'                    => 'required|numeric|min:0',
            'cashier_name'             => 'nullable|string',
            'payment_method'           => 'nullable|string',
            'reference_number'         => 'nullable|string',
            'pax_regular'              => 'required|integer|min:0',
            'pax_senior'               => 'required|integer|min:0',
            'pax_pwd'                  => 'required|integer|min:0',
            'pax_diplomat'             => 'required|integer|min:0',
            'senior_id'                => 'nullable|string',
            'pwd_id'                   => 'nullable|string',
            'diplomat_id'              => 'nullable|string',
            'discount_remarks'         => 'nullable|string',
            'vatable_sales'            => 'required|numeric',
            'vat_amount'               => 'required|numeric',
        ]);

        $user        = auth('sanctum')->user();
        $cashierName = $request->input('cashier_name') ?? ($user ? $user->name : 'System Admin');
        $userId      = $user ? $user->id : null;
        $officialOR  = $validated['si_number'];

        try {
            DB::beginTransaction();

            $chargeType = null;
            $totalQty   = 0;

            foreach ($validated['items'] as $item) {
                $totalQty += $item['quantity'];
                if (isset($item['charges'])) {
                    if ($item['charges']['grab']  ?? false) $chargeType = 'grab';
                    if ($item['charges']['panda'] ?? false) $chargeType = 'panda';
                }
            }

            // ── 1. Create Sale ─────────────────────────────────────────────────────
            $sale = Sale::create([
                'user_id'             => $userId,
                'total_amount'        => $validated['total'],
                'invoice_number'      => $officialOR,
                'status'              => 'completed',
                'payment_method'      => $request->input('payment_method', 'cash'),
                'reference_number'    => $request->input('reference_number'),
                'charge_type'         => $chargeType,
                'pax_regular'         => $validated['pax_regular'],
                'pax_senior'          => $validated['pax_senior'],
                'pax_pwd'             => $validated['pax_pwd'],
                'pax_diplomat'        => $validated['pax_diplomat'],
                'senior_id'           => $validated['senior_id']        ?? null,
                'pwd_id'              => $validated['pwd_id']           ?? null,
                'diplomat_id'         => $validated['diplomat_id']      ?? null,
                'discount_remarks'    => $validated['discount_remarks'] ?? null,
                'vatable_sales'       => $validated['vatable_sales'],
                'vat_amount'          => $validated['vat_amount'],
                'pax'                 => $validated['pax_regular'] + $validated['pax_senior']
                                       + $validated['pax_pwd']    + $validated['pax_diplomat'],
                'is_synced'           => false,
            ]);

            // ── 2. Create Sale Items ───────────────────────────────────────────────
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id'      => $sale->id,
                    'menu_item_id' => $item['menu_item_id'],
                    'product_name' => $item['name'],
                    'quantity'     => $item['quantity'],
                    'price'        => (float) $item['unit_price'] + (($item['size'] ?? null) === 'L' ? 20 : 0),
                    'final_price'  => $item['total_price'],
                    'size'         => $item['size']        ?? null,
                    'sugar_level'  => $item['sugar_level'] ?? null,
                    'options'      => $item['options']     ?? null,
                    'add_ons'      => $item['add_ons']     ?? null,
                ]);

                $menuItem = MenuItem::find($item['menu_item_id']);
                if ($menuItem) {
                    $menuItem->decrement('quantity', $item['quantity']);
                }
            }

            // ── 3. Create Receipt ──────────────────────────────────────────────────
            Receipt::create([
                'si_number'    => $officialOR,
                'terminal'     => '01',
                'items_count'  => $totalQty,
                'cashier_name' => $cashierName,
                'total_amount' => $validated['total'],
                'sale_id'      => $sale->id,
            ]);

            // ── 4. Deduct Raw Materials ────────────────────────────────────────────
            // Called here (after SaleItems exist) so the observer has rows to query.
            // Runs inside the same DB transaction — rolls back automatically on error.
            app(SaleObserver::class)->deductStock($sale);

            DB::commit();
            $this->dashboardService->clearTodayCache();

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
        $sales = Sale::with('items', 'user')->latest()->paginate(20);
        return response()->json($sales);
    }

    /**
     * Void/Cancel a sale.
     * Restores both MenuItem quantity AND raw material stock.
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

            // ── Restore MenuItem quantities ────────────────────────────────────────
            foreach ($sale->items as $item) {
                $menuItem = MenuItem::find($item->menu_item_id);
                if ($menuItem) {
                    $menuItem->increment('quantity', $item->quantity);
                } else {
                    Log::warning("Inventory restore failed for sale #{$sale->invoice_number}: MenuItem ID {$item->menu_item_id} not found.");
                }
            }

            // ── Update Sale Status ─────────────────────────────────────────────────
            // The SaleObserver@updated will detect status → 'cancelled'
            // and automatically reverse all raw material deductions.
            $sale->update([
                'status'               => 'cancelled',
                'cancellation_reason'  => $request->reason,
                'cancelled_at'         => now(),
            ]);

            DB::commit();
            $this->dashboardService->clearTodayCache();

            return response()->json(['status' => 'success', 'message' => 'Voided successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale cancellation failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}