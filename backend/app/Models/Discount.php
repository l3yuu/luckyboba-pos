<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Discount extends Model
{
    protected $fillable = [
        'name',
        'amount',
        'type',
        'status',
        'used_count',
    ];

    protected $casts = [
        'amount'     => 'float',
        'used_count' => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'discount_branches')
                    ->withTimestamps();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Increment the used count when a discount is redeemed.
     * Call this from your Order/Sale controller when applying a discount.
     */
    public function recordUsage(): void
    {
        $this->increment('used_count');
    }
}