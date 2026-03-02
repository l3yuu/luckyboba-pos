<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VoucherController extends Controller
{
    /**
     * Get all vouchers ordered by latest update
     */
    public function index()
    {
        try {
            $vouchers = Voucher::orderBy('updated_at', 'desc')->get();
            return response()->json($vouchers);
        } catch (\Exception $e) {
            Log::error("Voucher Index Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch vouchers'], 500);
        }
    }

    /**
     * Store a new voucher
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:vouchers,code|max:50',
            'value' => 'required|string',
            'type' => 'required|string|in:Percentage,Fixed Amount,Gift Certificate',
        ], [
            'code.unique' => 'This voucher code already exists.',
        ]);

        try {
            $voucher = Voucher::create([
                'code' => strtoupper($validated['code']),
                'value' => $validated['value'],
                'type' => $validated['type'],
                'status' => 'Active',
                'receipt' => 'N/A'
            ]);

            return response()->json($voucher, 201);
        } catch (\Exception $e) {
            Log::error("Voucher Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }
}