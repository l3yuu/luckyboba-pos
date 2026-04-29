<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use App\Models\CashCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CashTransactionController extends Controller
{
    /**
     * Display a listing of transactions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $query = CashTransaction::where('user_id', $userId);

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            if ($request->has('date')) {
                $query->whereDate('created_at', $request->date);
            }

            $transactions = $query->orderBy('created_at', 'desc')->get();

            return response()->json($transactions);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a new transaction (Cash In, Cash Out, Cash Drop)
     */
    public function store(Request $request): JsonResponse
    {
        $user   = Auth::user();
        $userId = $user->id;
        $branchId = $user->branch_id; 
        $today  = now()->toDateString();

        $validated = $request->validate([
            'type'   => 'required|in:cash_in,cash_out,cash_drop',
            'amount' => 'required|numeric|min:0',
            'note'   => 'nullable|string|max:255',
        ]);

        $shift = $this->getCurrentShiftNumber($branchId);

        if ($shift > 2) {
            return response()->json([
                'success' => false,
                'message' => 'Terminal is locked. Maximum of 2 shifts per day reached.'
            ], 403);
        }

        // 1. SHIFT INITIALIZATION CHECK
        $hasCashedInThisShift = CashTransaction::where('branch_id', $branchId)
            ->where('type', 'cash_in')
            ->whereDate('created_at', $today)
            ->where('shift', $shift)
            ->exists();

        if (!$hasCashedInThisShift && $validated['type'] !== 'cash_in') {
            return response()->json([
                'success' => false,
                'message' => "Shift {$shift} not initialized. Please perform Cash In first."
            ], 403);
        }

        // 2. PREVENT DOUBLE CASH-IN PER SHIFT
        if ($validated['type'] === 'cash_in' && $hasCashedInThisShift) {
            return response()->json([
                'success' => false,
                'message' => "Shift {$shift} has already been initialized."
            ], 422);
        }

        try {
            $transaction = CashTransaction::create([
                'user_id'   => $userId,
                'branch_id' => $branchId,
                'type'      => $validated['type'],
                'amount'    => $validated['amount'],
                'note'      => $validated['note'],
                'shift'     => $shift,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction recorded successfully',
                'data'    => $transaction
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function getCurrentShiftNumber(int $branchId): int
    {
        $today = now()->toDateString();
        // Count how many EODs (CashCount) exist for today in this branch
        return CashCount::where('branch_id', $branchId)
            ->where('date', $today)
            ->count() + 1;
    }
}