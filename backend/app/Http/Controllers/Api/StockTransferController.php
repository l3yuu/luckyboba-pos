<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\StockMovement;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    // GET /api/stock-transfers
    public function index(Request $request)
    {
        $user  = auth()->user();
        $query = StockTransfer::with([
            'fromBranch',
            'toBranch',
            'items.rawMaterial',
            'createdBy',
            'approvedBy',
            'dispatchedBy',
            'receivedBy',
        ]);

        // 1. If branch_id is explicitly provided (e.g. from a filter or scoped view)
        if ($request->filled('branch_id')) {
            $branchId = $request->branch_id;
            $query->where(function ($q) use ($branchId) {
                $q->where('from_branch_id', $branchId)
                  ->orWhere('to_branch_id', $branchId);
            });
        } 
        // 2. Otherwise, fall back to the user's branch if not a superadmin
        elseif ($user->role !== 'superadmin') {
            $query->where(function ($q) use ($user) {
                $q->where('from_branch_id', $user->branch_id)
                  ->orWhere('to_branch_id', $user->branch_id);
            });
        }

        $transfers = $query->latest()
            ->get()
            ->map(fn(StockTransfer $t) => $this->format($t));

        return response()->json($transfers);
    }

    // POST /api/stock-transfers
    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'superadmin' && $request->from_branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized. You can only initiate transfers from your own branch.'], 403);
        }

        $request->validate([
            'from_branch_id'          => 'nullable|exists:branches,id',
            'to_branch_id'            => 'nullable|exists:branches,id|different:from_branch_id',
            'transfer_date'           => 'required|date',
            'notes'                   => 'nullable|string|max:500',
            'items'                   => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity'        => 'required|numeric|min:0.0001',
        ]);

        foreach ($request->items as $item) {
            $stock = RawMaterial::where('id', $item['raw_material_id'])
                ->where('branch_id', $request->from_branch_id)
                ->value('current_stock');

            if ($item['quantity'] > ($stock ?? 0)) {
                $matName = RawMaterial::find($item['raw_material_id'])->name ?? 'Unknown';
                return response()->json(['message' => "Insufficient stock for {$matName}. Available: " . (float)$stock], 422);
            }
        }

        $transfer = DB::transaction(function () use ($request) {
            $transfer = StockTransfer::create([
                'transfer_number' => $this->generateNumber(),
                'from_branch_id'  => $request->from_branch_id,
                'to_branch_id'    => $request->to_branch_id,
                'transfer_date'   => $request->transfer_date,
                'notes'           => $request->notes,
                'status'          => 'Pending',
                'created_by_id'   => auth()->id(),
            ]);

            foreach ($request->items as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'raw_material_id'   => $item['raw_material_id'],
                    'quantity'          => $item['quantity'],
                ]);
            }

            return $transfer->load([
                'fromBranch',
                'toBranch',
                'items.rawMaterial',
                'createdBy',
                'approvedBy',
                'dispatchedBy',
                'receivedBy',
            ]);
        });

        return response()->json(['data' => $this->format($transfer)], 201);
    }

    // POST /api/stock-transfers/{stockTransfer}/approve
    public function approve(StockTransfer $stockTransfer)
    {
        $user = auth()->user();
        if ($user->role !== 'superadmin' && $user->branch_id !== $stockTransfer->from_branch_id) {
            abort(403, 'Unauthorized. Only management from the source branch can approve this transfer.');
        }

        abort_if(
            $stockTransfer->status !== 'Pending',
            422,
            'Only Pending transfers can be approved.'
        );

        foreach ($stockTransfer->items as $item) {
            $stock = RawMaterial::where('id', $item->raw_material_id)
                ->where('branch_id', $stockTransfer->from_branch_id)
                ->value('current_stock');

            if ($item->quantity > ($stock ?? 0)) {
                $matName = $item->rawMaterial->name ?? 'Unknown';
                abort(422, "Insufficient stock for {$matName}. Available: " . (float)$stock . ". Cannot approve.");
            }
        }

        $stockTransfer->update([
            'status' => 'Approved',
            'approved_by_id' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh([
                    'fromBranch',
                    'toBranch',
                    'items.rawMaterial',
                    'createdBy',
                    'approvedBy',
                    'dispatchedBy',
                    'receivedBy',
                ])
            )
        ]);
    }

    // POST /api/stock-transfers/{stockTransfer}/in-transit
    public function inTransit(StockTransfer $stockTransfer)
    {
        $user = auth()->user();
        if ($user->role !== 'superadmin' && $user->branch_id !== $stockTransfer->from_branch_id) {
            abort(403, 'Unauthorized. Only management from the source branch can dispatch this transfer.');
        }

        abort_if(
            $stockTransfer->status !== 'Approved',
            422,
            'Only Approved transfers can be dispatched.'
        );

        foreach ($stockTransfer->items as $item) {
            $stock = RawMaterial::where('id', $item->raw_material_id)
                ->where('branch_id', $stockTransfer->from_branch_id)
                ->value('current_stock');

            if ($item->quantity > ($stock ?? 0)) {
                $matName = $item->rawMaterial->name ?? 'Unknown';
                abort(422, "Insufficient stock for {$matName}. Available: " . (float)$stock . ". Cannot dispatch.");
            }
        }

        DB::transaction(function () use ($stockTransfer) {
            foreach ($stockTransfer->items as $item) {
                // Deduct current_stock from source
                RawMaterial::where('id', $item->raw_material_id)
                    ->where('branch_id', $stockTransfer->from_branch_id)
                    ->decrement('current_stock', $item->quantity);

                // Log to stock_movements for history consistency
                StockMovement::create([
                    'raw_material_id' => $item->raw_material_id,
                    'branch_id'       => $stockTransfer->from_branch_id,
                    'user_id'         => auth()->id(),
                    'type'            => 'subtract',
                    'quantity'        => $item->quantity,
                    'reason'          => 'Stock transfer out (In Transit) — ' . $stockTransfer->transfer_number,
                ]);
            }

            $stockTransfer->update([
                'status' => 'In Transit',
                'dispatched_by_id' => auth()->id(),
                'dispatched_at' => now(),
            ]);
        });

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh([
                    'fromBranch',
                    'toBranch',
                    'items.rawMaterial',
                    'createdBy',
                    'approvedBy',
                    'dispatchedBy',
                    'receivedBy',
                ])
            )
        ]);
    }

    // POST /api/stock-transfers/{stockTransfer}/receive
    public function receive(StockTransfer $stockTransfer)
    {
        $user = auth()->user();
        if ($user->role !== 'superadmin' && $user->branch_id !== $stockTransfer->to_branch_id) {
            abort(403, 'Unauthorized. Only management from the destination branch can receive this transfer.');
        }

        abort_if(
            !in_array($stockTransfer->status, ['Approved', 'In Transit']),
            422,
            'Only Approved or In Transit transfers can be received.'
        );

        $isDirectReceiveFromApproved = $stockTransfer->status === 'Approved';

        DB::transaction(function () use ($stockTransfer, $isDirectReceiveFromApproved) {
            foreach ($stockTransfer->items as $item) {
                $sourceMaterial = $item->rawMaterial;
                $parentId = $sourceMaterial?->parent_id ?? $item->raw_material_id;

                // If receiving directly from Approved (without dispatch), deduct source now.
                if ($isDirectReceiveFromApproved) {
                    RawMaterial::where('id', $item->raw_material_id)
                        ->where('branch_id', $stockTransfer->from_branch_id)
                        ->decrement('current_stock', $item->quantity);

                    StockMovement::create([
                        'raw_material_id' => $item->raw_material_id,
                        'branch_id'       => $stockTransfer->from_branch_id,
                        'user_id'         => auth()->id(),
                        'type'            => 'subtract',
                        'quantity'        => $item->quantity,
                        'reason'          => 'Stock transfer out (Direct Receive) — ' . $stockTransfer->transfer_number,
                    ]);
                }

                // Find matching material in destination branch using parent_id logic
                $destMat = RawMaterial::where('branch_id', $stockTransfer->to_branch_id)
                    ->where(function ($q) use ($item) {
                        $parentId = $item->rawMaterial?->parent_id ?? $item->raw_material_id;
                        $q->where('parent_id', $parentId)
                          ->orWhere('id', $parentId);
                    })
                    ->first();

                // If destination material does not exist yet, create it from source metadata.
                if (!$destMat && $sourceMaterial) {
                    $destMat = RawMaterial::create([
                        'name'            => $sourceMaterial->name,
                        'unit'            => $sourceMaterial->unit,
                        'category'        => $sourceMaterial->category,
                        'current_stock'   => 0,
                        'reorder_level'   => $sourceMaterial->reorder_level,
                        'is_intermediate' => $sourceMaterial->is_intermediate,
                        'notes'           => $sourceMaterial->notes,
                        'branch_id'       => $stockTransfer->to_branch_id,
                        'parent_id'       => $parentId,
                    ]);
                }

                if (!$destMat) {
                    continue;
                }

                $destMat->increment('current_stock', $item->quantity);
                StockMovement::create([
                    'raw_material_id' => $destMat->id,
                    'branch_id'       => $stockTransfer->to_branch_id,
                    'user_id'         => auth()->id(),
                    'type'            => 'add',
                    'quantity'        => $item->quantity,
                    'reason'          => 'Stock transfer received — ' . $stockTransfer->transfer_number,
                ]);
            }

            $stockTransfer->update([
                'status' => 'Received',
                'received_by_id' => auth()->id(),
                'received_at' => now(),
            ]);
        });

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh([
                    'fromBranch',
                    'toBranch',
                    'items.rawMaterial',
                    'createdBy',
                    'approvedBy',
                    'dispatchedBy',
                    'receivedBy',
                ])
            )
        ]);
    }

    // POST /api/stock-transfers/{stockTransfer}/cancel
    public function cancel(StockTransfer $stockTransfer)
    {
        $user = auth()->user();
        if ($user->role !== 'superadmin' && $user->branch_id !== $stockTransfer->from_branch_id) {
            abort(403, 'Unauthorized. Only management from the source branch can cancel this transfer.');
        }

        abort_if(
            !in_array($stockTransfer->status, ['Pending', 'Approved']),
            422,
            'Only Pending or Approved transfers can be cancelled.'
        );

        $stockTransfer->update(['status' => 'Cancelled']);

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh([
                    'fromBranch',
                    'toBranch',
                    'items.rawMaterial',
                    'createdBy',
                    'approvedBy',
                    'dispatchedBy',
                    'receivedBy',
                ])
            )
        ]);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function format(StockTransfer $t): array
    {
        return [
            'id'               => $t->id,
            'transfer_number'  => $t->transfer_number,
            'from_branch_id'   => $t->from_branch_id,
            'to_branch_id'     => $t->to_branch_id,
            'from_branch'      => $t->fromBranch ? ['name' => $t->fromBranch->name] : null,
            'to_branch'        => $t->toBranch   ? ['name' => $t->toBranch->name]   : null,
            'transfer_date'    => $t->transfer_date,
            'status'           => $t->status,
            'notes'            => $t->notes,
            'created_by'       => $t->createdBy ? ['name' => $t->createdBy->name] : null,
            'created_at'       => $t->created_at,
            'approved_by'      => $t->approvedBy ? ['name' => $t->approvedBy->name] : null,
            'approved_at'      => $t->approved_at,
            'dispatched_by'    => $t->dispatchedBy ? ['name' => $t->dispatchedBy->name] : null,
            'dispatched_at'    => $t->dispatched_at,
            'received_by'      => $t->receivedBy ? ['name' => $t->receivedBy->name] : null,
            'received_at'      => $t->received_at,
            'items'            => $t->items->map(fn($i) => [
                'id'              => $i->id,
                'raw_material_id' => $i->raw_material_id,
                'quantity'        => $i->quantity,
                'raw_material'    => $i->rawMaterial ? [
                    'name' => $i->rawMaterial->name,
                    'unit' => $i->rawMaterial->unit,
                ] : null,
            ])->values(),
        ];
    }

    private function generateNumber(): string
    {
        $date  = now()->format('Ymd');
        $count = StockTransfer::whereDate('created_at', today())->count() + 1;
        return 'TRF-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}