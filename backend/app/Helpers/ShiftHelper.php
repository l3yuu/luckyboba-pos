<?php

namespace App\Helpers;

use App\Models\CashTransaction;
use App\Models\CashCount;
use Carbon\Carbon;

class ShiftHelper
{
    /**
     * Get the current active shift and its business date.
     * 
     * Logic:
     * 1. Check if there is an "Open Shift" (a Cash In with no corresponding Cash Count).
     *    If found, return its shift and the date it was started.
     * 2. If no open shift, determine the next available shift for the current calendar date.
     *    However, if it's early morning (before 4 AM), we might still be in "yesterday's" cycle
     *    if we are looking for the NEXT shift. But usually, a new Cash In after midnight 
     *    should probably start a new day if the previous day was closed.
     */
    public static function getCurrentShift(int $branchId): array
    {
        $now = Carbon::now();
        
        // 1. Look for the latest "Cash In" that hasn't been closed by an EOD
        // We look back up to 24 hours to find an open shift
        $openCashIn = CashTransaction::where('branch_id', $branchId)
            ->where('type', 'cash_in')
            ->where('created_at', '>=', $now->copy()->subHours(24))
            ->latest('created_at')
            ->first();

        if ($openCashIn) {
            // Check if this specific Cash In has a corresponding Cash Count
            // We use the date from the Cash In's created_at as the business date
            $businessDate = $openCashIn->created_at->toDateString();
            
            $isClosed = CashCount::where('branch_id', $branchId)
                ->where('date', $businessDate)
                ->where('shift', $openCashIn->shift)
                ->exists();

            if (!$isClosed) {
                return [
                    'shift' => (int) $openCashIn->shift,
                    'date'  => $businessDate,
                ];
            }
        }

        // 2. No open shift found. Determine the next shift for the current business day.
        // If it's between 12 AM and 4 AM, and we are STARTING a new shift, 
        // it's a bit ambiguous. But typically, if someone cashes in at 2 AM, 
        // they are likely finishing yesterday's PM shift if it wasn't started, 
        // or starting a very early AM shift.
        
        // BIR/POS Standard: Business day rolls over at a fixed time or after Z-Reading.
        // For Lucky Boba, we'll use the calendar date, but we'll prioritize "repeating" correctly.
        
        $today = $now->toDateString();
        
        // If it's early morning (e.g. 1 AM) and we are looking for a NEW shift,
        // we should check if yesterday's shifts were completed.
        // But the user said "everyday the shifting is umuulit", so they probably 
        // want 12 AM to be the hard reset for NEW shifts.
        
        $eodCount = CashCount::where('branch_id', $branchId)
            ->where('date', $today)
            ->count();

        return [
            'shift' => $eodCount + 1,
            'date'  => $today,
        ];
    }
}
