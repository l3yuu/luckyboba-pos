<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZReading extends Model
{
    protected $fillable = [
        'reading_date',
        'branch_id',
        'total_sales',
        'net_sales',
        'data',
        'is_closed',
        'closed_at',
    ];

    protected $casts = [
        'data' => 'array', // This ensures 'data' is saved as JSON in DB but acts as an Array in PHP
    ];

    /**
     * Get the branch that owns this Z-Reading.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}