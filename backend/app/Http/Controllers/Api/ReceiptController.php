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

        // If no query, return the latest receipts so the table isn't empty on load
        if (empty($query)) {
            $receipts = Receipt::latest()->limit(50)->get();
            return response()->json($receipts);
        }

        $lowQuery = strtolower($query);

        $receipts = Receipt::whereRaw('LOWER(si_number) LIKE ?', ["%{$lowQuery}%"])
            ->orWhereRaw('LOWER(cashier_name) LIKE ?', ["%{$lowQuery}%"])
            ->orWhereRaw('LOWER(terminal) LIKE ?', ["%{$lowQuery}%"])
            ->latest()
            ->get();

        return response()->json($receipts);
    }
}