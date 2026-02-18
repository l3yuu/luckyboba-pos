<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');
        $date = $request->input('date'); // New date input

        $dbQuery = Receipt::query()
            ->leftJoin('sales', 'receipts.sale_id', '=', 'sales.id')
            ->select([
                'receipts.*', 
                'sales.status', 
                'sales.cancellation_reason'
            ]);

        // Filter by Date if provided
        if (!empty($date)) {
            $dbQuery->whereDate('receipts.created_at', $date);
        }

        // Filter by Search Query
        if (!empty($query)) {
            $lowQuery = strtolower($query);
            $dbQuery->where(function($q) use ($lowQuery) {
                $q->whereRaw('LOWER(receipts.si_number) LIKE ?', ["%{$lowQuery}%"])
                  ->orWhereRaw('LOWER(receipts.cashier_name) LIKE ?', ["%{$lowQuery}%"])
                  ->orWhereRaw('LOWER(receipts.terminal) LIKE ?', ["%{$lowQuery}%"]);
            });
        }

        $results = $dbQuery->latest('receipts.created_at')->limit(50)->get();

        return response()->json($results);
    }
}