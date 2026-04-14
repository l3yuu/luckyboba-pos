<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Traits\LoyaltyCheck;

class OnlineOrderController extends Controller
{
    use LoyaltyCheck;

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Sale::with(['items', 'user', 'branch'])
            ->where('invoice_number', 'like', 'APP-%')
            ->whereNotIn('status', ['cancelled']);

        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        } elseif (!empty($user->branch_name)) {
            $branch = \App\Models\Branch::where('name', $user->branch_name)->first();
            if ($branch) {
                $query->where('branch_id', $branch->id);
            }
        }

        $orders = $query->orderByDesc('created_at')
            ->get()
            ->map(fn($sale) => $this->formatOrder($sale));

        return response()->json($orders);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status'      => ['required', 'in:pending,preparing,completed'],
            'branch_name' => 'required|string|exists:branches,name',
        ]);

        $user  = $request->user();
        $query = Sale::where('id', $id)
            ->where('invoice_number', 'like', 'APP-%');

        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        } else {
            $branchName = !empty($user->branch_name)
                ? $user->branch_name
                : $request->input('branch_name');

            $branch = \App\Models\Branch::where('name', $branchName)->first();
            if ($branch) {
                $query->where('branch_id', $branch->id);
            }
        }

        $sale         = $query->firstOrFail();
        $sale->status = $request->status;
        $sale->save();

        return response()->json($this->formatOrder($sale->load(['items', 'user'])));
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = Sale::with(['items', 'user', 'branch'])
            ->where('user_id', $request->user()->id)
            ->where('invoice_number', 'like', 'APP-%')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($sale) => $this->formatOrder($sale));

        return response()->json($orders);
    }

    public function reorder(Request $request, int $id): JsonResponse
    {
        if (!$this->hasActiveCard($request)) {
            return $this->loyaltyRequiredResponse();
        }

        $sale = Sale::with('items')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $items = $sale->items->map(function ($item) {
            // Check if MenuItem still exists and is active
            $menuItem = \App\Models\MenuItem::find($item->menu_item_id);
            
            return [
                'menu_item_id' => $item->menu_item_id,
                'name'         => $item->product_name,
                'quantity'     => $item->quantity,
                'unit_price'   => $menuItem ? $menuItem->price : $item->unit_price,
                'cup_size'     => $item->size,
                'add_ons'      => $item->add_ons,
                'is_available' => $menuItem && $menuItem->status === 'active',
            ];
        });

        return response()->json([
            'success' => true,
            'items'   => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'si_number'      => 'required|string',
                'subtotal'       => 'required|numeric',
                'total'          => 'required|numeric',
                'payment_method' => 'required|string',
                'order_type'     => 'required|string',
                'items'          => 'required|array',
                'branch_name'    => 'required|string',
            ]);

            $promoApplied = $request->input('promo_applied'); 
            $allowedPromos = ['Buy 1, Get 1 Free', '10% Off All Items'];
            if ($promoApplied !== null && !in_array($promoApplied, $allowedPromos)) {
                return response()->json(['message' => 'Invalid promo type.'], 422);
            }

            // ── B1T1 validation: only valid for Classic Milktea items ─────────────
            if ($promoApplied === 'Buy 1, Get 1 Free') {
                $items    = collect($request->input('items', []));
                $itemIds  = $items->pluck('menu_item_id')->filter()->values()->toArray();

                $classicItems = \DB::table('menu_items')
                    ->whereIn('id', $itemIds)
                    ->where('category_id', 22)
                    ->get();

                $classicQty = 0;
                foreach ($classicItems as $classicItem) {
                    $ordered     = $items->firstWhere('menu_item_id', $classicItem->id);
                    $classicQty += $ordered['quantity'] ?? 1;
                }

                if ($classicQty < 2) {
                    return response()->json([
                        'message' => 'Buy 1 Take 1 requires at least 2 Classic Milktea items in your cart.',
                    ], 422);
                }
            }

            // ── Record perk usage ─────────────────────────────────────────────────
            if ($promoApplied && $request->input('card_id')) {
                $today  = now()->toDateString();
                $userId = $request->user()->id;
                $cardId = $request->input('card_id');

                $alreadyUsed = \DB::table('card_usage_logs')
                    ->where('user_id', $userId)
                    ->where('promo_type', $promoApplied)
                    ->whereDate('used_date', $today)
                    ->exists();

                if ($alreadyUsed) {
                    return response()->json([
                        'message' => 'You have already used this perk today.',
                    ], 409);
                }

                \DB::table('card_usage_logs')->insert([
                    'user_id'    => $userId,
                    'card_id'    => $cardId,
                    'promo_type' => $promoApplied, // stores 'Buy 1, Get 1 Free' or '10% Off All Items'
                    'used_date'  => $today,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if ($request->filled('voucher_id')) {
                \App\Models\Voucher::where('id', $request->voucher_id)->increment('times_used');
            }

            $branch = \App\Models\Branch::whereRaw(
                'LOWER(name) = ?', [strtolower($request->input('branch_name'))]
            )->first();

            \Log::info('Branch lookup', [
                'requested' => $request->input('branch_name'),
                'found'     => $branch?->name,
                'found_id'  => $branch?->id,
            ]);

            $sale = Sale::create([
                'invoice_number' => $request->si_number,
                'branch_id'      => $branch?->id,
                'user_id'        => $request->user()->id,
                'customer_name'  => $request->user()->name,
                'total_amount'   => $request->total,
                'subtotal'       => $request->subtotal,
                'vatable_sales'  => $request->input('vatable_sales', 0),
                'vat_amount'     => $request->input('vat_amount', 0),
                'payment_method' => $request->payment_method,
                'order_type'     => $request->order_type,
                'cashier_name'   => 'Customer App',
                'status'         => 'pending',
                'cash_tendered'  => $request->input('cash_tendered', $request->total),
            ]);

            foreach ($request->items as $item) {
                $sale->items()->create([
                    'product_name' => $item['name'],
                    'quantity'     => $item['quantity'],
                    'unit_price'   => $item['unit_price'],
                    'price'        => $item['unit_price'],
                    'final_price'  => $item['total_price'],
                    'menu_item_id' => $item['menu_item_id'] ?? null,
                    'size'         => $item['cup_size'] ?? null,
                    'add_ons'      => $item['add_ons'] ?? null,
                ]);
            }

            $sale->load(['items', 'user', 'branch']);

            // ── Calculate Earned Points (Dynamic) ──────────────────────────────────
            $pointsRatio = (float) (\App\Models\Setting::where('key', 'points_per_currency')->value('value') ?? 1.0);
            $cardMult   = (float) (\App\Models\Setting::where('key', 'card_point_multiplier')->value('value') ?? 2.0);

            $pointsEarned = (int) floor($request->total * $pointsRatio);
            if ($request->input('card_id')) {
                $pointsEarned = (int) ($pointsEarned * $cardMult);
            }

            \DB::table('user_points')->updateOrInsert(
                ['user_id' => $request->user()->id],
                ['points'  => \DB::raw("points + $pointsEarned"), 'updated_at' => now()]
            );

            \DB::table('point_transactions')->insert([
                'user_id'      => $request->user()->id,
                'type'         => 'earn',
                'points'       => $pointsEarned,
                'source'       => 'order',
                'reference_id' => $sale->id,
                'note'         => "Earned from order {$sale->invoice_number}",
                'created_at'   => now(),
            ]);

            return response()->json([
                'success'   => true,
                'si_number' => $sale->invoice_number,
                'qr_code'   => str_replace('APP-', '', $sale->invoice_number),
                'points_earned' => $pointsEarned, 
                'order'     => $this->formatOrder($sale),
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Order placement failed', [
                'error' => $e->getMessage(),
                'line'  => $e->getLine(),
                'file'  => $e->getFile(),
                'trace' => $e->getTraceAsString(),
                'data'  => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage(), // Show message temporarily for debugging
            ], 500);
        }
    }

    /**
     * GET /api/online-orders/stats
     * Summary statistics for the online order queue.
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $user  = $request->user();
            $query = Sale::where('invoice_number', 'like', 'APP-%');

            // Branch scoping
            if (!empty($user->branch_id)) {
                $query->where('branch_id', $user->branch_id);
            } elseif (!empty($user->branch_name)) {
                $branch = \App\Models\Branch::where('name', $user->branch_name)->first();
                if ($branch) $query->where('branch_id', $branch->id);
            }

            $pending   = (clone $query)->where('status', 'pending')->count();
            $preparing = (clone $query)->where('status', 'preparing')->count();

            $completedToday = (clone $query)
                ->where('status', 'completed')
                ->whereDate('updated_at', now()->toDateString())
                ->count();

            $totalToday = (clone $query)
                ->whereDate('created_at', now()->toDateString())
                ->sum('total_amount');

            // Average wait time (minutes) for orders completed today
            $avgWait = (clone $query)
                ->where('status', 'completed')
                ->whereDate('updated_at', now()->toDateString())
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_wait')
                ->value('avg_wait');

            return response()->json([
                'success' => true,
                'data'    => [
                    'pending'         => $pending,
                    'preparing'       => $preparing,
                    'completed_today' => $completedToday,
                    'total_today'     => round((float) ($totalToday ?? 0), 2),
                    'avg_wait_min'    => round((float) ($avgWait ?? 0), 1),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve order stats',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    private function formatOrder($sale): array
    {
        $code = str_replace('APP-', '', $sale->invoice_number);

        return [
            'id'             => $sale->id,
            'invoice_number' => $sale->invoice_number,
            'customer_name'  => $sale->user ? $sale->user->name : 'App Customer',
            'customer_code'  => $code,
            'qr_code'        => $code,
            'branch_name'    => $sale->branch?->name ?? null,
            'total_amount'   => (float) $sale->total_amount,
            'status'         => $sale->status ?? 'pending',
            'created_at'     => $sale->created_at,
            'items'          => $sale->items->map(function ($item) {
                $rawAddons = $item->add_ons;
                if (is_string($rawAddons)) {
                    $decoded   = json_decode($rawAddons, true);
                    $rawAddons = (json_last_error() === JSON_ERROR_NONE) ? $decoded : [$rawAddons];
                }
                $finalAddons = is_array($rawAddons) ? $rawAddons : [];

                return [
                    'id'       => $item->id,
                    'name'     => $item->product_name,
                    'qty'      => (int) $item->quantity,
                    'price'    => (float) $item->final_price,
                    'cup_size' => $item->size ?? null,
                    'add_ons'  => $finalAddons,
                ];
            })->values()->toArray(),
        ];
    }
}