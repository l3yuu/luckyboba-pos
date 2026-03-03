<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashCount;
use App\Models\CashTransaction;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CashCountController extends Controller
{
    /**
     * Store the End of Day (EOD) Cash Count
     * This version automatically calculates the expected cash drop.
     */
    public function store(Request $request): JsonResponse
    {
        // Validate actual cash counted and the breakdown (denominations)
        $validated = $request->validate([
            'total' => 'required|numeric|min:0',
            'breakdown' => 'required|array',
            'remarks' => 'nullable|string',
        ]);

        try {
            $userId = Auth::id();
            $today = now()->toDateString();

            // 1. Get Initial Cash (First cash_in of the day)
            $initialCash = CashTransaction::where('user_id', $userId)
                ->where('type', 'cash_in')
                ->whereDate('created_at', $today)
                ->sum('amount');

            // 2. Get Total Sales for today
            $totalSales = Sale::whereDate('created_at', $today)
                ->where('status', 'completed')
                ->sum('total_amount');

            // 3. Get other cash movements (if any)
            // Skip the first cash_in (initial) and sum any subsequent ones
            $otherCashIn = CashTransaction::where('user_id', $userId)
                ->where('type', 'cash_in')
                ->whereDate('created_at', $today)
                ->offset(1)
                ->limit(PHP_INT_MAX)
                ->sum('amount');

            $cashOut = CashTransaction::where('user_id', $userId)
                ->where('type', 'cash_out')
                ->whereDate('created_at', $today)
                ->sum('amount');

            // 4. AUTOMATIC CALCULATION (Expected Cash Drop)
            $expectedCashDrop = ($initialCash + $totalSales + $otherCashIn) - $cashOut;

            // 5. Calculate Shortage or Overage based on what the cashier actually counted
            $actualCashCounted = $validated['total'];
            $shortOver = $actualCashCounted - $expectedCashDrop;

            // 6. Save the record
            $cashCount = CashCount::create([
                'user_id' => $userId,
                'terminal_id' => '01',
                'expected_amount' => $expectedCashDrop, // System calculated
                'actual_amount' => $actualCashCounted,  // Cashier input
                'short_over' => $shortOver,
                'breakdown' => $validated['breakdown'], // Store denominations JSON
                'remarks' => $validated['remarks'],
                'date' => $today,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'End of Day count recorded successfully',
                'data' => $cashCount
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record EOD',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if EOD is already done for today
     */
    public function checkEodStatus(Request $request): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['isEodDone' => false], 401);
        }

        $isEodDone = CashCount::where('user_id', $request->user()->id)
            ->whereDate('created_at', now()->toDateString())
            ->exists();

        return response()->json(['isEodDone' => $isEodDone]);
    }

    /**
     * Check if the cashier has started their shift (Cash In)
     */
    public function checkInitialCash(Request $request): JsonResponse
    {
        try {
            $hasCashedIn = CashTransaction::where('user_id', $request->user()->id)
                ->where('type', 'cash_in')
                ->whereDate('created_at', now()->toDateString())
                ->exists();

            return response()->json(['hasCashedIn' => $hasCashedIn]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}