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
    public function index()
    {
        $transfers = StockTransfer::with(['fromBranch', 'toBranch', 'items.rawMaterial'])
            ->latest()
            ->get()
            ->map(fn(StockTransfer $t) => $this->format($t));

        return response()->json($transfers);
    }

    // POST /api/stock-transfers
    public function store(Request $request)
    {
        $request->validate([
            'from_branch_id'          => 'required|exists:branches,id',
            'to_branch_id'            => 'required|exists:branches,id|different:from_branch_id',
            'transfer_date'           => 'required|date',
            'notes'                   => 'nullable|string|max:500',
            'items'                   => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'items.*.quantity'        => 'required|numeric|min:0.0001',
        ]);

        $transfer = DB::transaction(function () use ($request) {
            $transfer = StockTransfer::create([
                'transfer_number' => $this->generateNumber(),
                'from_branch_id'  => $request->from_branch_id,
                'to_branch_id'    => $request->to_branch_id,
                'transfer_date'   => $request->transfer_date,
                'notes'           => $request->notes,
                'status'          => 'Pending',
            ]);

            foreach ($request->items as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'raw_material_id'   => $item['raw_material_id'],
                    'quantity'          => $item['quantity'],
                ]);
            }

            return $transfer->load(['fromBranch', 'toBranch', 'items.rawMaterial']);
        });

        return response()->json(['data' => $this->format($transfer)], 201);
    }

    // POST /api/stock-transfers/{stockTransfer}/approve
    public function approve(StockTransfer $stockTransfer)
    {
        abort_if(
            $stockTransfer->status !== 'Pending',
            422,
            'Only Pending transfers can be approved.'
        );

        $stockTransfer->update(['status' => 'Approved']);

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh(['fromBranch', 'toBranch', 'items.rawMaterial'])
            )
        ]);
    }

    // POST /api/stock-transfers/{stockTransfer}/receive
    public function receive(StockTransfer $stockTransfer)
    {
        abort_if(
            $stockTransfer->status !== 'Approved',
            422,
            'Only Approved transfers can be received.'
        );

        DB::transaction(function () use ($stockTransfer) {
            foreach ($stockTransfer->items as $item) {
                // Deduct current_stock from source
                RawMaterial::where('id', $item->raw_material_id)
                    ->decrement('current_stock', $item->quantity);

                // Log to stock_movements for history consistency
                StockMovement::create([
                    'raw_material_id' => $item->raw_material_id,
                    'type'            => 'subtract',
                    'quantity'        => $item->quantity,
                    'reason'          => 'Stock transfer out — ' . $stockTransfer->transfer_number,
                ]);
            }

            $stockTransfer->update(['status' => 'Received']);
        });

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh(['fromBranch', 'toBranch', 'items.rawMaterial'])
            )
        ]);
    }

    // POST /api/stock-transfers/{stockTransfer}/cancel
    public function cancel(StockTransfer $stockTransfer)
    {
        abort_if(
            !in_array($stockTransfer->status, ['Pending', 'Approved']),
            422,
            'Only Pending or Approved transfers can be cancelled.'
        );

        $stockTransfer->update(['status' => 'Cancelled']);

        return response()->json([
            'data' => $this->format(
                $stockTransfer->fresh(['fromBranch', 'toBranch', 'items.rawMaterial'])
            )
        ]);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function format(StockTransfer $t): array
    {
        return [
            'id'              => $t->id,
            'transfer_number' => $t->transfer_number,
            'from_branch_id'  => $t->from_branch_id,
            'to_branch_id'    => $t->to_branch_id,
            'from_branch'     => $t->fromBranch ? ['name' => $t->fromBranch->name] : null,
            'to_branch'       => $t->toBranch   ? ['name' => $t->toBranch->name]   : null,
            'transfer_date'   => $t->transfer_date,
            'status'          => $t->status,
            'notes'           => $t->notes,
            'created_at'      => $t->created_at,
            'items'           => $t->items->map(fn($i) => [
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