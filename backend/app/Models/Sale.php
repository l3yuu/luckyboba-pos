<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne; // 1. Add this import

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'total_amount',
        'payment_method',
        'charge_type', // grab, panda, or null
        'pax',
        'user_id',     // Links to the admin/staff who made the sale
        'is_synced'
    ];

    /**
     * Get the items for the sale.
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Get the user (admin/staff) who performed the sale.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the receipt record associated with the sale.
     * 2. Added this for Search and History linking
     */
    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }
}