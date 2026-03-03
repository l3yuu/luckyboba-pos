<?php

namespace App\Services;

use App\Models\CashTransaction;
use App\Models\Sale;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CashierService
{
    /**
     * Record Cash In or Cash Drop
     */
    public function recordCashMovement(string $type, float $amount, ?string $note = null)
    {
        return CashTransaction::create([
            'user_id' => Auth::id(),
            'type'    => $type, // 'cash_in', 'cash_drop', or 'cash_out'
            'amount'  => $amount,
            'note'    => $note,
        ]);
    }

    /**
     * Search for Receipts by ID or Date
     */
    public function searchReceipts($query)
    {
        return Sale::with('items') // Assumes you have 'items' relationship in Sale model
            ->where('id', 'like', "%{$query}%")
            ->orWhereDate('created_at', $query)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * End of Day (EOD) Calculation
     * Calculates what SHOULD be in the drawer
     */
    public function getExpectedDrawerAmount()
    {
        $today = Carbon::today();

        $cashIn = CashTransaction::whereDate('created_at', $today)->where('type', 'cash_in')->sum('amount');
        $sales  = Sale::whereDate('created_at', $today)->where('payment_method', 'cash')->sum('total_amount');
        $drops  = CashTransaction::whereDate('created_at', $today)->where('type', 'cash_drop')->sum('amount');
        $out    = CashTransaction::whereDate('created_at', $today)->where('type', 'cash_out')->sum('amount');

        return ($cashIn + $sales) - ($drops + $out);
    }
}