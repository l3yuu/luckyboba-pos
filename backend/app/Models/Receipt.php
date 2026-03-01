<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'si_number',
        'terminal',
        'items_count',
        'cashier_name',
        'total_amount',
        'sale_id',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'total_amount' => 'float',
        'items_count' => 'integer',
        'created_at' => 'datetime:Y-m-d H:i:s',
    ];

    /**
     * The accessors to append to the model's array form.
     * This makes 'or_number' available in your JSON responses.
     */
    protected $appends = ['or_number'];

    /**
     * Accessor for OR Number.
     * Maps the content of si_number to a logical or_number property.
     */
    public function getOrNumberAttribute()
    {
        return $this->si_number;
    }

    /**
     * Relationship: A receipt belongs to a specific sale transaction.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}