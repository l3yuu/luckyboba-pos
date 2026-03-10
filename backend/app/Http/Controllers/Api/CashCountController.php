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
     * Automatically calculates the expected cash on hand.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'total'     => 'required|numeric|min:0',
            'breakdown' => 'required|array',
            'remarks'   => 'nullable|string',
        ]);

        try {
            $userId   = Auth::id();
            $branchId = Auth::user()->branch_id;
            $today    = now()->toDateString();

            // 1. Get total cash_in for the day (all cash_in transactions)
            $totalCashIn = CashTransaction::where('user_id', $userId)
                ->where('type', 'cash_in')
                ->whereDate('created_at', $today)
                ->sum('amount');

            // 2. Get just the first cash_in (opening float / initial cash)
            $initialCash = CashTransaction::where('user_id', $userId)
                ->where('type', 'cash_in')
                ->whereDate('created_at', $today)
                ->orderBy('created_at')
                ->value('amount') ?? 0;

            // 3. Any cash_in entries after the first one (mid-shift additions)
            $otherCashIn = $totalCashIn - $initialCash;

            // 4. Total sales collected during the shift
            $totalSales = Sale::where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->where('status', 'completed')
                ->sum('total_amount');

            // 5. All cash removed from the drawer (cash_out + cash_drop)
            $cashOut = CashTransaction::where('user_id', $userId)
                ->whereIn('type', ['cash_out', 'cash_drop'])
                ->whereDate('created_at', $today)
                ->sum('amount');

            // 6. Expected cash on hand = opening float + sales + mid-shift additions - removals
            //    Simplifies to: totalCashIn + totalSales - cashOut
            $expectedCashDrop = ($initialCash + $totalSales + $otherCashIn) - $cashOut;

            // 7. Shortage (negative) or overage (positive)
            $actualCashCounted = $validated['total'];
            $shortOver         = $actualCashCounted - $expectedCashDrop;

            // 8. Save the record
            $cashCount = CashCount::create([
                'user_id'         => $userId,
                'branch_id'       => $branchId,
                'terminal_id'     => '01',
                'expected_amount' => $expectedCashDrop,
                'actual_amount'   => $actualCashCounted,
                'short_over'      => $shortOver,
                'breakdown'       => $validated['breakdown'],
                'remarks'         => $validated['remarks'],
                'date'            => $today,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'End of Day count recorded successfully',
                'data'    => $cashCount,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record EOD',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if EOD is already done for today (used by Sidebar lock check)
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
     * Check if the cashier has performed their opening Cash In for today
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