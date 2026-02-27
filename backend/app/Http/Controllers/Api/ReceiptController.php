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
    public function search(Request $request)
{
    $query = $request->input('query');
    $date  = $request->input('date');
    $user  = auth()->user(); // ✅ get the logged-in user

    $dbQuery = Receipt::query()
        ->leftJoin('sales', 'receipts.sale_id', '=', 'sales.id')
        ->select([
            'receipts.id',
            'receipts.si_number',
            'receipts.total_amount',
            'receipts.cashier_name',
            'receipts.terminal',
            'receipts.created_at',
            'receipts.sale_id',
            'receipts.items_count',
            'sales.status',
            'sales.cancellation_reason',
        ]);

    // ✅ Filter by branch — superadmin sees all, others see only their branch
    if ($user->role !== 'superadmin' && $user->branch_id) {
        $dbQuery->where('receipts.branch_id', $user->branch_id);
    }

    // Filter by date if provided
    if (!empty($date)) {
        $dbQuery->whereDate('receipts.created_at', $date);
    }

    // Filter by invoice number, cashier name, or terminal
    if (!empty($query)) {
        $lowQuery = strtolower($query);
        $dbQuery->where(function ($q) use ($lowQuery) {
            $q->whereRaw('LOWER(receipts.si_number) LIKE ?',      ["%{$lowQuery}%"])
              ->orWhereRaw('LOWER(receipts.cashier_name) LIKE ?', ["%{$lowQuery}%"])
              ->orWhereRaw('LOWER(receipts.terminal) LIKE ?',     ["%{$lowQuery}%"]);
        });
    }

    $results = $dbQuery->latest('receipts.created_at')->limit(50)->get();

    return response()->json($results->values());
}
}