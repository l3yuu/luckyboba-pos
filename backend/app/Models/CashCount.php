<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashCount extends Model
{
    protected $fillable = [
        'user_id',
        'terminal_id',
        'expected_amount', // Added: The "Cash Drop" value
        'actual_amount',   // Renamed/Added: What the cashier counted
        'short_over',      // Added: The difference
        'breakdown', 
        'remarks', 
        'date'             // Added: For easy filtering by day
    ];

    protected $casts = [
        'breakdown' => 'array',
        'expected_amount' => 'float',
        'actual_amount' => 'float',
        'short_over' => 'float',
        'date' => 'date',
    ];

    /**
     * Relationship to the User who performed the count.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}