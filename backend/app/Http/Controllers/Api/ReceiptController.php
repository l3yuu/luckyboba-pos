<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    /**
     * GET /api/receipts/search?query=INV-001&date=2026-02-21
     *
     * Returns a flat JSON array so the frontend normalizer can remap:
     *   si_number    → Invoice
     *   total_amount → Amount
     *   status       → Status
     *   created_at   → Date_Time
     */

    public function getNextSequence()
    {
        $latest = \App\Models\Sale::where('invoice_number', 'LIKE', 'SI-%')
            ->whereRaw("invoice_number REGEXP '^SI-[0-9]+$'") // skip corrupted NaN records
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
            ]);

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

        // Calculate stats from the result set
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
}