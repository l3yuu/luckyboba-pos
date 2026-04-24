<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashCount extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',     
        'terminal_id',
        'expected_amount',
        'actual_amount',
        'short_over',
        'breakdown',
        'remarks',
        'date',
        'shift',
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