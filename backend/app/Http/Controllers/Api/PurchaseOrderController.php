<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseOrderController extends Controller
{
    // ─── List ──────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = PurchaseOrder::with([
                'items.rawMaterial',
                'branch',
                'supplier',
                'createdBy',
                'approvedBy',
                'receivedBy',
            ])->orderBy('date_ordered', 'desc');

            if ($user->role !== 'superadmin' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }

            $orders = $query->get()->map(fn (PurchaseOrder $po) => $this->format($po));

            // Stats scoped the same way
            $statsQuery = PurchaseOrder::query();
            if ($user->role !== 'superadmin' && $user->branch_id) {
                $statsQuery->where('branch_id', $user->branch_id);
            }

            $stats = [
                'active_orders'   => (clone $statsQuery)->whereIn('status', ['Draft', 'Approved'])->count(),
                'pending_payment' => (float) (clone $statsQuery)->where('status', 'Draft')->sum('total_amount'),
                'monthly_spend'   => (float) (clone $statsQuery)
                    ->whereMonth('date_ordered', Carbon::now()->month)
                    ->where('status', 'Received')
                    ->sum('total_amount'),
            ];

            return response()->json([
                'data'  => $orders,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('PO index error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─── Store ─────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'supplier_id'     => 'required|exists:suppliers,id',
                'branch_id'       => 'required|exists:branches,id',
                'expected_date'   => 'nullable|date',
                'notes'           => 'nullable|string',
                'items'           => 'required|array|min:1',
                'items.*.raw_material_id' => 'required|exists:raw_materials,id',
                'items.*.quantity'        => 'required|numeric|min:0.01',
                'items.*.unit_cost'       => 'nullable|numeric|min:0',
            ]);

            $user = $request->user();

            return DB::transaction(function () use ($validated, $user) {
                $count = PurchaseOrder::whereYear('created_at', date('Y'))->count() + 1;
                $poNumber = 'PO-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                $totalAmount = collect($validated['items'])->sum(fn ($i) =>
                    ($i['quantity'] ?? 0) * ($i['unit_cost'] ?? 0)
                );

                $po = PurchaseOrder::create([
                    'po_number'     => $poNumber,
                    'supplier_id'   => $validated['supplier_id'],
                    'branch_id'     => $validated['branch_id'],
                    'date_ordered'  => now()->toDateString(),
                    'expected_date' => $validated['expected_date'] ?? null,
                    'notes'         => $validated['notes'] ?? null,
                    'total_amount'  => $totalAmount,
                    'status'        => 'Draft',
                    'created_by_id' => $user->id,
                ]);

                foreach ($validated['items'] as $item) {
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $po->id,
                        'raw_material_id'   => $item['raw_material_id'],
                        'quantity'          => $item['quantity'],
                        'unit_cost'         => $item['unit_cost'] ?? 0,
                    ]);
                }

                return response()->json([
                    'data' => $this->format($po->fresh([
                        'items.rawMaterial', 'branch', 'supplier',
                        'createdBy', 'approvedBy', 'receivedBy',
                    ])),
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('PO Store Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create Purchase Order.'], 500);
        }
    }

    // ─── Approve ───────────────────────────────────────────────────────
    public function approve(PurchaseOrder $purchaseOrder)
    {
        abort_if($purchaseOrder->status !== 'Draft', 422, 'Only Draft POs can be approved.');

        $purchaseOrder->update([
            'status'         => 'Approved',
            'approved_by_id' => auth()->id(),
        ]);

        return response()->json([
            'data' => $this->format($purchaseOrder->fresh([
                'items.rawMaterial', 'branch', 'supplier',
                'createdBy', 'approvedBy', 'receivedBy',
            ])),
        ]);
    }

    // ─── Receive ───────────────────────────────────────────────────────
    public function receive(PurchaseOrder $purchaseOrder)
    {
        abort_if(
            !in_array($purchaseOrder->status, ['Approved', 'Draft']),
            422,
            'Only Draft or Approved POs can be received.'
        );

        DB::transaction(function () use ($purchaseOrder) {
            foreach ($purchaseOrder->items as $poItem) {
                // Find the raw material for this branch
                $mat = RawMaterial::where('id', $poItem->raw_material_id)
                    ->where('branch_id', $purchaseOrder->branch_id)
                    ->first();

                // If material doesn't exist in this branch, try parent_id logic
                if (!$mat) {
                    $sourceMat = RawMaterial::find($poItem->raw_material_id);
                    $parentId  = $sourceMat?->parent_id ?? $poItem->raw_material_id;

                    $mat = RawMaterial::where('branch_id', $purchaseOrder->branch_id)
                        ->where(function ($q) use ($parentId) {
                            $q->where('parent_id', $parentId)
                              ->orWhere('id', $parentId);
                        })
                        ->first();

                    // If still not found, clone from source
                    if (!$mat && $sourceMat) {
                        $mat = RawMaterial::create([
                            'name'            => $sourceMat->name,
                            'unit'            => $sourceMat->unit,
                            'category'        => $sourceMat->category,
                            'current_stock'   => 0,
                            'reorder_level'   => $sourceMat->reorder_level,
                            'is_intermediate' => $sourceMat->is_intermediate,
                            'notes'           => $sourceMat->notes,
                            'branch_id'       => $purchaseOrder->branch_id,
                            'parent_id'       => $parentId,
                        ]);
                    }
                }

                if (!$mat) {
                    Log::warning('PO receive: material not found for branch', [
                        'po_id'           => $purchaseOrder->id,
                        'raw_material_id' => $poItem->raw_material_id,
                        'branch_id'       => $purchaseOrder->branch_id,
                    ]);
                    continue;
                }

                $mat->increment('current_stock', $poItem->quantity);

                StockMovement::create([
                    'raw_material_id' => $mat->id,
                    'branch_id'       => $purchaseOrder->branch_id,
                    'user_id'         => auth()->id(),
                    'type'            => 'add',
                    'quantity'        => $poItem->quantity,
                    'reason'          => 'Purchase order received — ' . $purchaseOrder->po_number,
                ]);
            }

            // Create Expense record
            \App\Models\Expense::create([
                'branch_id'   => $purchaseOrder->branch_id,
                'recorded_by' => auth()->id(),
                'ref_num'     => $purchaseOrder->po_number,
                'title'       => 'Inventory Purchase — ' . ($purchaseOrder->supplier?->name ?? 'Unknown Supplier'),
                'notes'       => $purchaseOrder->notes ?? 'Order Received',
                'date'        => now()->toDateString(),
                'category'    => 'Inventory',
                'amount'      => $purchaseOrder->total_amount,
            ]);

            $purchaseOrder->update([
                'status'         => 'Received',
                'received_by_id' => auth()->id(),
            ]);
        });

        return response()->json([
            'data' => $this->format($purchaseOrder->fresh([
                'items.rawMaterial', 'branch', 'supplier',
                'createdBy', 'approvedBy', 'receivedBy',
            ])),
        ]);
    }

    // ─── Cancel ────────────────────────────────────────────────────────
    public function cancel(PurchaseOrder $purchaseOrder)
    {
        abort_if(
            !in_array($purchaseOrder->status, ['Draft', 'Approved']),
            422,
            'Only Draft or Approved POs can be cancelled.'
        );

        $purchaseOrder->update([
            'status' => 'Cancelled',
        ]);

        return response()->json([
            'data' => $this->format($purchaseOrder->fresh([
                'items.rawMaterial', 'branch', 'supplier',
                'createdBy', 'approvedBy', 'receivedBy',
            ])),
        ]);
    }

    // ─── Legacy updateStatus (kept for backward compat) ────────────────
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Draft,Approved,Received,Cancelled',
        ]);

        $po = PurchaseOrder::findOrFail($id);

        if ($validated['status'] === 'Approved') {
            return $this->approve($po);
        }
        if ($validated['status'] === 'Received') {
            return $this->receive($po);
        }
        if ($validated['status'] === 'Cancelled') {
            return $this->cancel($po);
        }

        $po->update(['status' => $validated['status']]);

        return response()->json([
            'data' => $this->format($po->fresh([
                'items.rawMaterial', 'branch', 'supplier',
                'createdBy', 'approvedBy', 'receivedBy',
            ])),
        ]);
    }

    // ─── Shared Formatter ──────────────────────────────────────────────
    private function format(PurchaseOrder $po): array
    {
        return [
            'id'              => $po->id,
            'po_number'       => $po->po_number,
            'supplier_id'     => $po->supplier_id,
            'supplier_name'   => $po->supplier?->name,
            'supplier'        => $po->supplier ? ['name' => $po->supplier->name] : null,
            'branch_id'       => $po->branch_id,
            'branch_name'     => $po->branch?->name,
            'branch'          => $po->branch ? ['name' => $po->branch->name] : null,
            'date_ordered'    => $po->date_ordered instanceof Carbon ? $po->date_ordered->format('Y-m-d') : $po->date_ordered,
            'expected_date'   => $po->expected_date instanceof Carbon ? $po->expected_date->format('Y-m-d') : $po->expected_date,
            'total_amount'    => $po->total_amount,
            'total_cost'      => $po->total_amount,
            'status'          => $po->status,
            'notes'           => $po->notes,
            'created_by'      => $po->createdBy ? ['name' => $po->createdBy->name] : null,
            'approved_by'     => $po->approvedBy ? ['name' => $po->approvedBy->name] : null,
            'received_by'     => $po->receivedBy ? ['name' => $po->receivedBy->name] : null,
            'created_at'      => $po->created_at?->toISOString(),
            'items'           => $po->items->map(fn ($i) => [
                'id'              => $i->id,
                'raw_material_id' => $i->raw_material_id,
                'material_name'   => $i->rawMaterial?->name,
                'unit'            => $i->rawMaterial?->unit,
                'quantity'        => $i->quantity,
                'unit_cost'       => $i->unit_cost,
            ])->toArray(),
        ];
    }
}