<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchManagerAppController extends Controller
{
    // ── GET /api/branch/app-orders ────────────────────────────────────────────
    public function appOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Sale::with(['items'])
            ->where('invoice_number', 'like', 'APP-%')
            ->whereDate('created_at', today());

        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        }

        $orders = $query
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($sale) => $this->formatOrder($sale));

        return response()->json($orders);
    }

    // ── PATCH /api/branch/app-orders/{id}/status ──────────────────────────────
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,preparing,completed'],
        ]);

        $user = $request->user();

        $query = Sale::where('id', $id)
            ->where('invoice_number', 'like', 'APP-%');

        if (!empty($user->branch_id)) {
            $query->where('branch_id', $user->branch_id);
        }

        $sale = $query->firstOrFail();
        $sale->update(['status' => $request->status]);

        return response()->json($this->formatOrder($sale->load('items')));
    }

    // ── GET /api/branch/menu-items ────────────────────────────────────────────
    public function menuItems(Request $request): JsonResponse
    {
        $user     = $request->user();
        $branchId = $user->branch_id;

        $overrides = \DB::table('branch_menu_availability')
            ->where('branch_id', $branchId)
            ->pluck('is_available', 'menu_item_id');

        $items = MenuItem::with('category')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => [
                'id'           => $item->id,
                'name'         => $item->name,
                'category'     => $item->category?->name ?? 'Uncategorized',
                'sellingPrice' => (float) ($item->price ?? $item->selling_price ?? 0),
                'quantity'     => (int)   ($item->quantity ?? 0),
                'is_available' => $overrides->has($item->id)
                    ? (bool) $overrides->get($item->id)
                    : true,
                'image'        => $item->image
                    ? (str_starts_with($item->image, 'http')
                        ? $item->image
                        : url('storage/' . $item->image))
                    : null,
            ]);

        return response()->json($items);
    }

    // ── POST /api/branch/menu-items/{id}/toggle ───────────────────────────────
    public function toggleMenuItem(Request $request, int $id): JsonResponse
    {
        $user     = $request->user();
        $branchId = $user->branch_id;

        $item = MenuItem::findOrFail($id);

        $existing = \DB::table('branch_menu_availability')
            ->where('branch_id',    $branchId)
            ->where('menu_item_id', $id)
            ->first();

        if ($existing) {
            $newValue = !$existing->is_available;
            \DB::table('branch_menu_availability')
                ->where('branch_id',    $branchId)
                ->where('menu_item_id', $id)
                ->update([
                    'is_available' => $newValue,
                    'updated_at'   => now(),
                ]);
        } else {
            \DB::table('branch_menu_availability')->insert([
                'branch_id'    => $branchId,
                'menu_item_id' => $id,
                'is_available' => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
            $newValue = false;
        }

        return response()->json([
            'id'           => $item->id,
            'name'         => $item->name,
            'is_available' => (bool) $newValue,
        ]);
    }

    // ── Private helper ────────────────────────────────────────────────────────
    private function formatOrder(Sale $sale): array
    {
        return [
            'id'             => $sale->id,
            'invoice_number' => $sale->invoice_number,
            'customer_name'  => $sale->customer_name ?? 'App Customer',
            'total_amount'   => (float) $sale->total_amount,
            'status'         => $sale->status ?? 'pending',
            'created_at'     => $sale->created_at,
            'items'          => $sale->items->map(function ($item) {
                $rawAddons = $item->add_ons;
                if (is_string($rawAddons)) {
                    $decoded   = json_decode($rawAddons, true);
                    $rawAddons = json_last_error() === JSON_ERROR_NONE ? $decoded : [$rawAddons];
                }
                return [
                    'id'       => $item->id,
                    'name'     => $item->product_name,
                    'qty'      => (int)   $item->quantity,
                    'price'    => (float) $item->final_price,
                    'cup_size' => $item->size ?? null,
                    'add_ons'  => is_array($rawAddons) ? $rawAddons : [],
                ];
            })->values()->toArray(),
        ];
    }
}