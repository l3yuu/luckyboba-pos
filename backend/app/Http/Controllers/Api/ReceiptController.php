<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function search(Request $request)
    {
        $query = strtolower($request->input('query'));

        // If no query is provided, return all receipts
        if (empty($query)) {
            $receipts = Receipt::latest()->get();
            return response()->json($receipts);
        }

        $receipts = Receipt::whereRaw('LOWER(si_number) LIKE ?', ["%{$query}%"])
            ->orWhereRaw('LOWER(cashier_name) LIKE ?', ["%{$query}%"])
            ->orWhereRaw('LOWER(terminal) LIKE ?', ["%{$query}%"])
            ->latest()
            ->get();

        return response()->json($receipts);
    }
}