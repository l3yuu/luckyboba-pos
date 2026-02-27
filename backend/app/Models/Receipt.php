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
    'branch_id', 
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
     * Relationship: A receipt belongs to a specific sale transaction.
     * This is needed for the 'with(['sale.items'])' call in your controller.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}