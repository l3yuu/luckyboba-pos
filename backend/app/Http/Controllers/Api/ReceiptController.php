<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\VoidRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ReceiptController extends Controller
{
    public function getNextSequence()
    {
        $latest = \App\Models\Sale::where('invoice_number', 'LIKE', 'SI-%')
            ->whereRaw("invoice_number REGEXP '^SI-[0-9]+$'")
            ->orderByRaw('CAST(SUBSTRING(invoice_number, 4) AS UNSIGNED) DESC')
            ->first();

        if (!$latest) {
            return response()->json(['next_sequence' => 1]);
        }

        $lastNumber = (int) substr($latest->invoice_number, 3);

        return response()->json(['next_sequence' => $lastNumber + 1]);
    }

    public function search(Request $request)
    {
        $query = $request->input('query');
        $date  = $request->input('date');
        $user  = auth()->user();

        $dbQuery = Receipt::query()
            ->leftJoin('sales', 'receipts.sale_id', '=', 'sales.id')
            ->select([
                'receipts.sale_id',
                'receipts.si_number',
                'receipts.total_amount',
                'receipts.cashier_name',
                'receipts.terminal',
                'receipts.items_count',
                'receipts.created_at',
                'sales.status',
                'sales.cancellation_reason',
            ])
            ->selectRaw('
                EXISTS(
                    SELECT 1 FROM sale_items si
                    JOIN menu_items mi ON si.menu_item_id = mi.id
                    JOIN categories c ON mi.category_id = c.id
                    WHERE si.sale_id = sales.id
                    AND c.type = "drink"
                ) as has_stickers
            ');   // ← add this block, keep everything else the same

        if ($user->role !== 'superadmin' && $user->branch_id) {
            $dbQuery->where('receipts.branch_id', $user->branch_id);
        }

        if (!empty($date)) {
            $dbQuery->whereDate('receipts.created_at', $date);
        }

        if (!empty($query)) {
            $lowQuery = strtolower($query);
            $dbQuery->where(function ($q) use ($lowQuery) {
                $q->whereRaw('LOWER(receipts.si_number) LIKE ?',      ["%{$lowQuery}%"])
                  ->orWhereRaw('LOWER(receipts.cashier_name) LIKE ?', ["%{$lowQuery}%"])
                  ->orWhereRaw('LOWER(receipts.terminal) LIKE ?',     ["%{$lowQuery}%"]);
            });
        }

        $results = $dbQuery->latest('receipts.created_at')->limit(50)->get();

        $gross  = $results->sum('total_amount');
        $voided = $results->where('status', 'cancelled')->sum('total_amount');
        $net    = $gross - $voided;

        return response()->json([
            'results' => $results->values(),
            'stats'   => [
                'gross'  => round($gross, 2),
                'voided' => round($voided, 2),
                'net'    => round($net, 2),
            ],
        ]);
    }

    // ─── Step 1: Cashier submits void request ───────────────────────────────

    public function voidRequest(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $sale = \App\Models\Sale::findOrFail($id);

        if ($sale->status === 'cancelled') {
            return response()->json(['message' => 'Already voided.'], 422);
        }

        $cashier = auth()->user();

        $voidRequest = VoidRequest::create([
            'sale_id'    => $sale->id,
            'cashier_id' => $cashier->id,
            'branch_id'  => $cashier->branch_id,
            'reason'     => $request->reason,
            'status'     => 'pending',
        ]);

        return response()->json([
            'message'         => 'Void request created.',
            'void_request_id' => $voidRequest->id,
        ]);
    }

    // ─── Step 2: Manager enters PIN to approve ──────────────────────────────

    public function approveVoid(Request $request, $voidRequestId)
    {
        $request->validate([
            'manager_pin' => 'required|string',
        ]);

        $voidRequest = VoidRequest::findOrFail($voidRequestId);

        if ($voidRequest->status !== 'pending') {
            return response()->json(['message' => 'Already processed.'], 422);
        }

        $manager = \App\Models\User::where('role', 'branch_manager')
            ->where('branch_id', $voidRequest->branch_id)
            ->first();

        if (!$manager || !$manager->manager_pin) {
            return response()->json(['message' => 'No manager PIN configured for this branch.'], 422);
        }

        if (!Hash::check($request->manager_pin, $manager->manager_pin)) {
            return response()->json(['message' => 'Incorrect PIN. Please try again.'], 403);
        }

        $voidRequest->update([
            'manager_id'  => $manager->id,
            'status'      => 'approved',
            'approved_at' => now(),
        ]);

        $sale = \App\Models\Sale::findOrFail($voidRequest->sale_id);
        $sale->update([
            'status'              => 'cancelled',
            'cancellation_reason' => $voidRequest->reason,
        ]);

        app(\App\Services\DashboardService::class)->clearAllTimeCache($sale->branch_id);

        return response()->json(['message' => 'Transaction voided successfully.']);
    }
public function reprint(Request $request, int $id)
{
    $type = $request->query('type', 'receipt');

    $sale = \App\Models\Sale::with([
        'items.menuItem.category',
        'branch',
    ])->findOrFail($id);

    $receipt = \App\Models\Receipt::where('sale_id', $id)->first();

    $saleArray = $sale->toArray();

    // Normalize: frontend expects `sale_items`, Laravel returns `items`
    if (!isset($saleArray['sale_items']) && isset($saleArray['items'])) {
        $saleArray['sale_items'] = $saleArray['items'];
    }

    $queueNumber = ltrim(str_replace('SI-', '', $sale->invoice_number), '0') ?: '0';
    $saleArray['queue_number'] = $queueNumber;

    return response()->json([
        'type'    => $type,
        'sale'    => $saleArray,
        'receipt' => $receipt,
    ]);
}
}