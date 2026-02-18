<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'total_amount',
        'payment_method',
        'charge_type', 
        'pax',
        'user_id',
        'is_synced',
        'invoice_number',
        'status',           // (completed, cancelled)
        'cancellation_reason', // Added for void audit
        'cancelled_at'         // Added for timestamp tracking
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'cancelled_at' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }
}