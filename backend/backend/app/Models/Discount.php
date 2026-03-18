<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Discount extends Model
{
    protected $fillable = [
        'name',
        'code',
        'amount',
        'type',
        'status',
        'used_count',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'amount'     => 'float',
        'used_count' => 'integer',
        'starts_at'  => 'date:Y-m-d',
        'ends_at'    => 'date:Y-m-d',
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

    /**
     * Check whether the discount is currently within its validity window.
     */
    public function isValid(): bool
    {
        $today = now()->startOfDay();

        if ($this->starts_at && $today->lt($this->starts_at)) return false;
        if ($this->ends_at   && $today->gt($this->ends_at))   return false;

        return $this->status === 'ON';
    }
}