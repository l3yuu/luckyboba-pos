<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderReceipt;
use App\Models\PurchaseOrderReceiptItem;
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
                'active_orders'   => (clone $statsQuery)->whereIn('status', ['Draft', 'Approved', 'Partially Received'])->count(),
                'pending_payment' => (float) (clone $statsQuery)->where('status', 'Draft')->sum('total_amount'),
                'monthly_spend'   => (float) PurchaseOrderReceipt::query()
                    ->when($user->role !== 'superadmin' && $user->branch_id, fn($q) => $q->where('branch_id', $user->branch_id))
                    ->whereMonth('received_at', Carbon::now()->month)
                    ->sum('total_amount_received'),
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
                'items.*.ordered_unit'      => 'nullable|string',
                'items.*.conversion_factor' => 'nullable|numeric|min:0.0001',
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
                        'ordered_unit'      => $item['ordered_unit'] ?? null,
                        'conversion_factor' => $item['conversion_factor'] ?? 1,
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

    // ─── Receive ALL (Legacy/Shortcut) ────────────────────────────────
    public function receive(PurchaseOrder $purchaseOrder)
    {
        abort_if(
            !in_array($purchaseOrder->status, ['Approved', 'Draft']),
            422,
            'Only Draft or Approved POs can be received.'
        );

        $itemsToReceive = $purchaseOrder->items->map(function ($item) {
            $remaining = $item->quantity - $item->quantity_received;
            return [
                'purchase_order_item_id' => $item->id,
                'quantity_received'      => $remaining > 0 ? $remaining : 0,
            ];
        })->filter(fn($i) => $i['quantity_received'] > 0)->values()->toArray();

        if (empty($itemsToReceive)) {
            return response()->json(['message' => 'All items already received.'], 422);
        }

        return $this->receiveItems(new Request(['items' => $itemsToReceive]), $purchaseOrder);
    }

    // ─── Partial / Specific Item Receiving ────────────────────────────
    public function receiveItems(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'reference_number' => 'nullable|string|max:255',
            'notes'            => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received'      => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($validated, $purchaseOrder) {
            $receipt = PurchaseOrderReceipt::create([
                'purchase_order_id' => $purchaseOrder->id,
                'branch_id'         => $purchaseOrder->branch_id,
                'received_by_id'    => auth()->id(),
                'reference_number'  => $validated['reference_number'] ?? null,
                'notes'             => $validated['notes'] ?? null,
            ]);

            $totalAmountReceived = 0;

            foreach ($validated['items'] as $itemData) {
                $poItem = PurchaseOrderItem::findOrFail($itemData['purchase_order_item_id']);
                $qtyToReceive = (float) $itemData['quantity_received'];

                // 1. Update PO Item
                $poItem->increment('quantity_received', $qtyToReceive);

                // 2. Find/Initialize Raw Material for Branch
                $mat = $this->ensureBranchMaterial($purchaseOrder->branch_id, $poItem->raw_material_id);
                
                if ($mat) {
                    $stockIncrement = $qtyToReceive * $poItem->conversion_factor;
                    
                    // Update Costing (WAC) BEFORE incrementing stock
                    $mat->updateBaseCost($stockIncrement, (float)$poItem->unit_cost);
                    
                    $mat->recordMovement(
                        $stockIncrement,
                        'add',
                        "PO Receipt " . ($receipt->reference_number ?? "") . " — {$purchaseOrder->po_number}"
                    );

                    // Propagate latest purchase price to Global Parent for template consistency
                    if ($mat->parent_id) {
                        $parent = RawMaterial::find($mat->parent_id);
                        if ($parent) {
                            $parent->update(['last_purchase_price' => $poItem->unit_cost]);
                        }
                    }
                }

                // 4. Create Receipt Item
                PurchaseOrderReceiptItem::create([
                    'purchase_order_receipt_id' => $receipt->id,
                    'purchase_order_item_id'    => $poItem->id,
                    'raw_material_id'           => $poItem->raw_material_id,
                    'quantity_received'         => $qtyToReceive,
                    'unit_cost'                 => $poItem->unit_cost,
                ]);

                $totalAmountReceived += ($qtyToReceive * $poItem->unit_cost);
            }

            $receipt->update(['total_amount_received' => $totalAmountReceived]);

            // 5. Create Integrated Expense for this receipt
            Expense::create([
                'branch_id'         => $purchaseOrder->branch_id,
                'supplier_id'       => $purchaseOrder->supplier_id,
                'purchase_order_id' => $purchaseOrder->id,
                'recorded_by'       => auth()->id(),
                'ref_num'           => $validated['reference_number'] ?? $purchaseOrder->po_number,
                'title'             => ($receipt->reference_number ? "Receipt {$receipt->reference_number} | " : "") . "PO: " . $purchaseOrder->po_number,
                'notes'             => $validated['notes'] ?? "Automatic expense from PO receipt.",
                'date'              => now()->toDateString(),
                'category'          => 'Inventory',
                'amount'            => $totalAmountReceived,
                'payment_status'    => 'Pending', // Financial Liability created
            ]);

            // 6. Update PO Status
            $purchaseOrder->refresh();
            $fullyReceived = true;
            foreach ($purchaseOrder->items as $item) {
                if ($item->quantity_received < $item->quantity) {
                    $fullyReceived = false;
                    break;
                }
            }

            $purchaseOrder->update([
                'status'         => $fullyReceived ? 'Received' : 'Partially Received',
                'received_by_id' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Items received successfully.',
                'data'    => $this->format($purchaseOrder->fresh([
                    'items.rawMaterial', 'branch', 'supplier', 'receipts.receiptItems.rawMaterial'
                ])),
            ]);
        });
    }

    private function ensureBranchMaterial($branchId, $rawMaterialId)
    {
        $mat = RawMaterial::where('id', $rawMaterialId)
            ->where('branch_id', $branchId)
            ->first();

        if (!$mat) {
            $sourceMat = RawMaterial::find($rawMaterialId);
            $parentId  = $sourceMat?->parent_id ?? $rawMaterialId;

            $mat = RawMaterial::where('branch_id', $branchId)
                ->where(function ($q) use ($parentId) {
                    $q->where('parent_id', $parentId)
                      ->orWhere('id', $parentId);
                })
                ->first();

            if (!$mat && $sourceMat) {
                $mat = RawMaterial::create([
                    'name'            => $sourceMat->name,
                    'unit'            => $sourceMat->unit,
                    'category'        => $sourceMat->category,
                    'current_stock'   => 0,
                    'reorder_level'   => $sourceMat->reorder_level,
                    'is_intermediate' => $sourceMat->is_intermediate,
                    'notes'           => $sourceMat->notes,
                    'branch_id'       => $branchId,
                    'parent_id'       => $parentId,
                ]);
            }
        }
        return $mat;
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
                'id'                => $i->id,
                'raw_material_id'   => $i->raw_material_id,
                'material_name'     => $i->rawMaterial?->name,
                'unit'              => $i->rawMaterial?->unit,
                'ordered_unit'      => $i->ordered_unit ?? $i->rawMaterial?->unit,
                'conversion_factor' => $i->conversion_factor,
                'quantity'          => $i->quantity,
                'quantity_received' => $i->quantity_received,
                'quantity_pending'  => max(0, $i->quantity - $i->quantity_received),
                'unit_cost'         => $i->unit_cost,
                'incoming_stock'    => $i->rawMaterial?->incoming_stock ?? 0,
            ])->toArray(),
            'receipts'        => $po->receipts->map(fn ($r) => [
                'id'               => $r->id,
                'reference_number' => $r->reference_number,
                'received_at'      => $r->received_at?->toDateTimeString(),
                'total_amount'     => $r->total_amount_received,
                'notes'            => $r->notes,
                'items'            => $r->receiptItems->map(fn ($ri) => [
                    'material_name'     => $ri->rawMaterial?->name,
                    'quantity_received' => $ri->quantity_received,
                ]),
            ]),
        ];
    }
}