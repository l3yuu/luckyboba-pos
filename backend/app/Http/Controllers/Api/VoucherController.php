<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

use App\Traits\LoyaltyCheck;

class VoucherController extends Controller
{
    use LoyaltyCheck;
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

    public function available(Request $request)
    {
        try {
            if (!$this->hasActiveCard($request)) {
                return response()->json(['success' => true, 'data' => [], 'message' => 'Loyalty card required to access vouchers.']);
            }

            $now = Carbon::now();
            $vouchers = Voucher::where('is_active', true)
                ->where('status', 'Active')
                ->where(function ($query) use ($now) {
                    $query->whereNull('expiry_date')
                          ->orWhere('expiry_date', '>=', $now->toDateString());
                })
                ->where(function ($query) {
                    $query->whereNull('usage_limit')
                          ->orWhereColumn('times_used', '<', 'usage_limit');
                })
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json(['success' => true, 'data' => $vouchers]);
        } catch (\Exception $e) {
            Log::error("Voucher Available Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch vouchers'], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:vouchers,code|max:50',
            'description' => 'nullable|string',
            'value' => 'required|string',
            'type' => 'required|string|in:Percentage,Fixed Amount,Gift Certificate',
            'min_spend' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ], [
            'code.unique' => 'This voucher code already exists.',
        ]);

        try {
            $voucher = Voucher::create([
                'code' => strtoupper($validated['code']),
                'description' => $validated['description'] ?? null,
                'value' => $validated['value'],
                'type' => $validated['type'],
                'min_spend' => $validated['min_spend'] ?? 0,
                'max_discount' => $validated['max_discount'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'usage_limit' => $validated['usage_limit'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'status' => 'Active',
                'receipt' => 'N/A'
            ]);

            return response()->json($voucher, 201);
        } catch (\Exception $e) {
            Log::error("Voucher Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $voucher = Voucher::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code,' . $id,
            'description' => 'nullable|string',
            'value' => 'required|string',
            'type' => 'required|string|in:Percentage,Fixed Amount,Gift Certificate',
            'min_spend' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        try {
            $voucher->update([
                'code' => strtoupper($validated['code']),
                'description' => $validated['description'] ?? null,
                'value' => $validated['value'],
                'type' => $validated['type'],
                'min_spend' => $validated['min_spend'] ?? 0,
                'max_discount' => $validated['max_discount'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'usage_limit' => $validated['usage_limit'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            return response()->json($voucher, 200);
        } catch (\Exception $e) {
            Log::error("Voucher Update Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $voucher = Voucher::findOrFail($id);
            $voucher->delete();
            return response()->json(['message' => 'Voucher deleted successfully']);
        } catch (\Exception $e) {
            Log::error("Voucher Delete Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to delete voucher'], 500);
        }
    }

    /**
     * Endpoint for mobile app to validate a code
     */
    public function validateCode(Request $request)
    {
        if (!$this->hasActiveCard($request)) {
            return $this->loyaltyRequiredResponse();
        }

        $code = strtoupper($request->query('code'));
        if (!$code) {
            return response()->json(['success' => false, 'message' => 'Voucher code required'], 400);
        }

        $voucher = Voucher::where('code', $code)->first();

        if (!$voucher || !$voucher->is_active || $voucher->status !== 'Active') {
            return response()->json(['success' => false, 'message' => 'Invalid or inactive voucher code.'], 404);
        }

        if ($voucher->expiry_date && Carbon::now()->isAfter($voucher->expiry_date)) {
            return response()->json(['success' => false, 'message' => 'This voucher has expired.'], 400);
        }

        if ($voucher->usage_limit && $voucher->times_used >= $voucher->usage_limit) {
            return response()->json(['success' => false, 'message' => 'This voucher has reached its usage limit.'], 400);
        }

        $minSpend = (float)($request->query('total') ?? 0);
        if ($voucher->min_spend > 0 && $minSpend < $voucher->min_spend) {
            return response()->json([
                'success' => false, 
                'message' => 'Minimum spend of ₱' . number_format($voucher->min_spend, 2) . ' required to use this voucher.'
            ], 400);
        }

        return response()->json(['success' => true, 'data' => $voucher]);
    }
}