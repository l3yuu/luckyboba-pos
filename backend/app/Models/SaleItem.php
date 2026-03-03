<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'menu_item_id',
        'product_name',
        'quantity',
        'price',
        'final_price',
        'sugar_level',
        'size',
        'options',
        'add_ons'
    ];

    /**
     * The attributes that should be cast.
     * This automatically converts JSON from MariaDB into PHP arrays.
     */
    protected $casts = [
        'options' => 'array',
        'add_ons' => 'array',
        'price' => 'decimal:2',
        'final_price' => 'decimal:2',
    ];

    /**
     * Get the sale that owns the item.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}