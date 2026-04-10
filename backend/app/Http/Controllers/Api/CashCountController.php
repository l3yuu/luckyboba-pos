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
     * Store a Cash In transaction and immediately signal menu availability.
     * Once saved, the menu is unlocked for all cashiers on the same branch.
     */
    public function storeCashIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount'  => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        try {
            $user     = $request->user();
            $branchId = $user->branch_id;
            $today    = now()->toDateString();

            // Prevent duplicate opening cash-in for the same branch on the same day
            $alreadyCashedIn = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->whereDate('created_at', $today)
                ->exists();

            if ($alreadyCashedIn) {
                return response()->json([
                    'success'       => true,
                    'message'       => 'Branch has already cashed in today',
                    'menuAvailable' => true,
                    'duplicate'     => true,
                ]);
            }

            // Save the cash-in transaction
            $cashTransaction = CashTransaction::create([
                'user_id'   => $user->id,
                'branch_id' => $branchId,
                'type'      => 'cash_in',
                'amount'    => $validated['amount'],
                'remarks'   => $validated['remarks'] ?? 'Opening float',
            ]);

            // Confirm it was persisted before signalling the frontend
            $menuAvailable = $cashTransaction->exists;

            return response()->json([
                'success'       => true,
                'message'       => 'Cash in recorded. Menu is now available.',
                'menuAvailable' => $menuAvailable,
                'data'          => $cashTransaction,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success'       => false,
                'message'       => 'Failed to record cash in',
                'menuAvailable' => false,
                'error'         => $e->getMessage(),
            ], 500);
        }
    }

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
     * Checks per-user so each cashier must do their own EOD.
     */
    public function checkEodStatus(Request $request): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['isEodDone' => false], 401);
        }

        $isEodDone = CashCount::where('user_id', $request->user()->id)
            ->whereRaw('DATE(created_at) = ?', [now()->toDateString()])
            ->exists();

        return response()->json(['isEodDone' => $isEodDone]);
    }

    /**
     * Check if the branch has had an opening Cash In today.
     * Any cashier on the same branch performing Cash In unlocks the terminal
     * for all cashiers on that branch — no need for each cashier to cash in separately.
     */
    public function checkInitialCash(Request $request): JsonResponse
    {
        try {
            $user     = $request->user();
            $branchId = $user->branch_id;

            // ✅ Check by branch_id, not user_id — shared cash-in unlocks the whole branch
            $hasCashedIn = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->whereRaw('DATE(created_at) = ?', [now()->toDateString()])
                ->exists();

            return response()->json(['hasCashedIn' => $hasCashedIn]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get the cash count summary for a given branch and date.
     */
    public function summary(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        $date     = $request->query('date', now()->toDateString());

        $query = CashCount::whereRaw('DATE(created_at) = ?', [$date]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        // Get the latest written cash count
        $cashCount = $query->latest()->first();

        // Also aggregate cash_in and cash_drop for that date/branch
        $cashIn = CashTransaction::whereRaw('DATE(created_at) = ?', [$date])
            ->where('type', 'cash_in')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('amount');

        $cashDrop = CashTransaction::whereRaw('DATE(created_at) = ?', [$date])
            ->whereIn('type', ['cash_drop', 'cash_out'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('amount');

        if (!$cashCount) {
             return response()->json([
                 'success'     => true,
                 'cash_count'  => [
                     'denominations' => [],
                     'grand_total'   => 0
                 ],
                 'expected_amount' => 0,
                 'actual_amount'   => 0,
                 'cash_in'         => $cashIn,
                 'cash_drop'       => $cashDrop
             ]);
        }

        // Breakdown is usually stored as a JSON array
        $breakdown = is_string($cashCount->breakdown) 
            ? json_decode($cashCount->breakdown, true) 
            : $cashCount->breakdown;

        return response()->json([
            'success'     => true,
            'cash_count'  => [
                'denominations' => $breakdown ?? [],
                'grand_total'   => $cashCount->actual_amount,
            ],
            'expected_amount' => $cashCount->expected_amount,
            'actual_amount'   => $cashCount->actual_amount,
            'cash_in'         => $cashIn,
            'cash_drop'       => $cashDrop
        ]);
    }
}