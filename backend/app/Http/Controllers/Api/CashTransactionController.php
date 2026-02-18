<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CashTransactionController extends Controller
{
    /**
     * Display a listing of transactions (Used by CashDrop.tsx)
     * This fixes the 500 error on GET /api/cash-transactions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $query = CashTransaction::where('user_id', $userId);

            // Filter by type (e.g., 'cash_drop') if provided
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by date if provided
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
     * Store a new transaction (Cash In, Cash Out, etc.)
     */
    public function store(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $today = now()->toDateString();

        // --- NEW SECURITY CHECK ---
        // Check if EOD is already done for today
        $isEodDone = \App\Models\CashCount::where('user_id', $userId)
            ->whereDate('date', $today)
            ->exists();

        if ($isEodDone) {
            return response()->json([
                'success' => false,
                'message' => 'Terminal is locked. End of Day has already been processed.'
            ], 403); // 403 means Forbidden
        }
        // ---------------------------

        $validated = $request->validate([
            'type'   => 'required|in:cash_in,cash_out,cash_drop',
            'amount' => 'required|numeric|min:0',
            'note'   => 'nullable|string|max:255',
        ]);

        try {
            $transaction = CashTransaction::create([
                'user_id' => $userId,
                'type'    => $validated['type'],
                'amount'  => $validated['amount'],
                'note'    => $validated['note']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction recorded successfully',
                'data' => $transaction
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}