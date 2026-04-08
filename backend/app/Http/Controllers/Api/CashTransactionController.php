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
        $branchId = $user->branch_id; // ← get from authenticated user
        $today  = now()->toDateString();

        // 1. GLOBAL LOCK: Check if EOD is already done for today
        $isEodDone = CashCount::where('user_id', $userId)
            ->where(function($query) use ($today) {
                $query->whereDate('date', $today)
                    ->orWhereDate('created_at', $today);
            })->exists();

        if ($isEodDone) {
            return response()->json([
                'success' => false,
                'message' => 'Terminal is locked. End of Day has already been processed.'
            ], 403);
        }

        $validated = $request->validate([
            'type'   => 'required|in:cash_in,cash_out,cash_drop',
            'amount' => 'required|numeric|min:0',
            'note'   => 'nullable|string|max:255',
        ]);

        // 2. SHIFT INITIALIZATION CHECK
        $hasCashedIn = CashTransaction::where('user_id', $userId)
            ->where('type', 'cash_in')
            ->whereDate('created_at', $today)
            ->exists();

        if (!$hasCashedIn && $validated['type'] !== 'cash_in') {
            return response()->json([
                'success' => false,
                'message' => 'Shift not initialized. Please perform Cash In first.'
            ], 403);
        }

        // 3. PREVENT DOUBLE CASH-IN
        if ($validated['type'] === 'cash_in' && $hasCashedIn) {
            return response()->json([
                'success' => false,
                'message' => 'You have already performed a Cash In for today.'
            ], 200);
        }

        try {
            $transaction = CashTransaction::create([
                'user_id'   => $userId,
                'branch_id' => $branchId, // ← added
                'type'      => $validated['type'],
                'amount'    => $validated['amount'],
                'note'      => $validated['note'],
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
}