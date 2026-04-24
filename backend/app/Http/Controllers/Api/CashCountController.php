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
            'shift'   => 'required|string|in:AM,PM',
        ]);

        try {
            $user     = $request->user();
            $branchId = $user->branch_id;
            $today    = now()->toDateString();
            $shift    = $validated['shift'];

            // Save shift to user profile for current session tracking
            $user->update(['current_shift' => $shift]);

            // Prevent duplicate opening cash-in for the same branch/shift on the same day
            $alreadyCashedIn = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->where('shift', $shift)
                ->whereDate('created_at', $today)
                ->exists();

            if ($alreadyCashedIn) {
                return response()->json([
                    'success'       => true,
                    'message'       => "Branch has already cashed in for {$shift} shift today",
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
                'note'      => $validated['remarks'] ?? "Opening float ({$shift})",
                'shift'     => $shift,
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
            'shift'     => 'nullable|string|in:AM,PM',
        ]);

        try {
            $userId   = Auth::id();
            $user     = Auth::user();
            $branchId = $user->branch_id;
            $today    = now()->toDateString();
            $shift    = $request->input('shift', $user->current_shift ?? 'AM');

            // 1. Get total cash_in for the shift
            $totalCashIn = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->where('shift', $shift)
                ->whereDate('created_at', $today)
                ->sum('amount');

            // 2. Get just the first cash_in for the shift (opening float)
            $initialCash = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->where('shift', $shift)
                ->whereDate('created_at', $today)
                ->orderBy('created_at')
                ->value('amount') ?? 0;

            // 3. Any cash_in entries after the first one (mid-shift additions)
            $otherCashIn = $totalCashIn - $initialCash;

            // 4. Total sales collected during the shift
            $totalSales = Sale::where('branch_id', $branchId)
                ->where('shift', $shift)
                ->whereDate('created_at', $today)
                ->where('status', 'completed')
                ->sum('total_amount');

            // 5. All cash removed from the drawer for this shift
            $cashOut = CashTransaction::where('branch_id', $branchId)
                ->whereIn('type', ['cash_out', 'cash_drop'])
                ->where('shift', $shift)
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
                'shift'           => $shift,
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
        $user = $request->user();
        if (!$user) {
            return response()->json(['isEodDone' => false], 401);
        }

        $shift = $request->query('shift', $user->current_shift);

        // A cashier is locked out of THEIR shift once THEY submit an EOD for it.
        $isEodDone = CashCount::where('user_id', $user->id)
            ->when($shift, fn($q) => $q->where('shift', $shift))
            ->whereDate('date', now()->toDateString())
            ->exists();

        // Terminal is only GLOBALLY locked if a PM shift has been completed.
        $isTerminalLocked = CashCount::where('branch_id', $user->branch_id)
            ->where('shift', 'PM')
            ->whereDate('date', now()->toDateString())
            ->exists();

        return response()->json([
            'isEodDone'        => $isEodDone,
            'isTerminalLocked' => $isTerminalLocked,
            'currentShift'     => $user->current_shift,
        ]);
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

            // Shift-aware check: Terminal is "Open" if there is a Cash In for a shift 
            // that hasn't been finalized (EOD) yet.
            $today = now()->toDateString();
            
            // 1. Check AM Status
            $amCashedIn = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->where('shift', 'AM')
                ->whereDate('created_at', $today)
                ->exists();
            $amClosed = CashCount::where('branch_id', $branchId)
                ->where('shift', 'AM')
                ->whereDate('date', $today)
                ->exists();

            // 2. Check PM Status
            $pmCashedIn = CashTransaction::where('branch_id', $branchId)
                ->where('type', 'cash_in')
                ->where('shift', 'PM')
                ->whereDate('created_at', $today)
                ->exists();
            $pmClosed = CashCount::where('branch_id', $branchId)
                ->where('shift', 'PM')
                ->whereDate('date', $today)
                ->exists();

            // Menu is available if (AM is open and not closed) OR (PM is open and not closed)
            $hasActiveShift = ($amCashedIn && !$amClosed) || ($pmCashedIn && !$pmClosed);

            return response()->json(['hasCashedIn' => $hasActiveShift]);
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