<?php
// app/Http/Controllers/OnlineOrderController.php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OnlineOrderController extends Controller
{
    /**
     * Return online orders matching the logged-in Cashier's branch.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Sale::with(['items', 'user', 'branch'])
            ->where('invoice_number', 'like', 'APP-%')
            ->whereNotIn('status', ['cancelled']);

        // 🟢 FILTER BY BRANCH: Only show orders for this cashier's branch
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

    /**
     * Update the status of an online order (Secured by branch).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,preparing,completed'],
            'branch_name' => 'required|string|exists:branches,name',
        ]);

        $user = $request->user();

        $query = Sale::where('id', $id)
            ->where('invoice_number', 'like', 'APP-%');

        // 🟢 SECURITY: Ensure cashiers can only update orders for their own branch
        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        } elseif (!empty($user->branch_name)) {
            $branch = \App\Models\Branch::where('name', $user->branch_name)->first();
            if ($branch) {
                $query->where('branch_id', $branch->id);
            }
        }

        $sale = $query->firstOrFail();

        $sale->status = $request->status;
        $sale->save();

        return response()->json($this->formatOrder($sale->load(['items', 'user'])));
    }

    /**
     * Return online orders exclusively for the logged-in mobile app customer.
     */
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'si_number'      => 'required|string',
            'subtotal'       => 'required|numeric',
            'total'          => 'required|numeric',
            'payment_method' => 'required|string',
            'order_type'     => 'required|string',
            'items'          => 'required|array',
            'branch_name'    => 'required|string', // Ensure this is expected
        ]);

        $branch = \App\Models\Branch::whereRaw('LOWER(name) = ?', [strtolower($request->input('branch_name'))])->first();
\Log::info('Branch lookup', [
    'requested' => $request->input('branch_name'),
    'found'     => $branch?->name,
    'found_id'  => $branch?->id,
]);

        $sale = Sale::create([
            'invoice_number' => $request->si_number, 
            'branch_id'      => $branch?->id, // This links the sale to SM Novaliches
            'user_id'        => $request->user()->id,
            'customer_name'  => $request->user()->name,
            'total_amount'   => $request->total,
            'subtotal'       => $request->subtotal,
            'vatable_sales'  => $request->input('vatable_sales', 0),
            'vat_amount'     => $request->input('vat_amount', 0),
            'payment_method' => $request->payment_method,
            'order_type'     => $request->order_type,
            'cashier_name'   => 'Customer App', // Good to distinguish it was made via the app
            'status'         => 'pending',
            'cash_tendered'  => $request->input('cash_tendered', $request->total),
        ]);

        // Create the sale items
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

        return response()->json([
            'success'    => true,
            'si_number'  => $sale->invoice_number,
            'qr_code'    => str_replace('APP-', '', $sale->invoice_number),
            'order'      => $this->formatOrder($sale),
        ], 201);
    }

    // ─── Private helpers ──────────────────────────────────────────────────

    private function formatOrder(Sale $sale): array
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
            'items'          => $sale->items->map(function($item) {
                
                // --- SAFETY NET FOR ADD-ONS ---
                $rawAddons = $item->add_ons;
                if (is_string($rawAddons)) {
                    $decoded = json_decode($rawAddons, true);
                    $rawAddons = (json_last_error() === JSON_ERROR_NONE) ? $decoded : [$rawAddons];
                }
                $finalAddons = is_array($rawAddons) ? $rawAddons : [];
                // ------------------------------

                return [
                    'id'       => $item->id,
                    'name'     => $item->product_name,
                    'qty'      => (int) $item->quantity,
                    'price'    => (float) $item->final_price,
                    'cup_size' => $item->size ?? null,
                    'add_ons'  => $finalAddons, // <- Use the safe variable
                ];
            })->values()->toArray(),
        ];
    }
}