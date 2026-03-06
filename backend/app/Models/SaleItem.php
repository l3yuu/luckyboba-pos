<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'add_ons',
    ];

    protected $casts = [
        'options'     => 'array',
        'add_ons'     => 'array',
        'price'       => 'decimal:2',
        'final_price' => 'decimal:2',
    ];

    // ── Existing Relationships ────────────────────────────────────────────────

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    // ── NEW Relationships ─────────────────────────────────────────────────────

    /**
     * The menu item this sale item was created from.
     * Note: menu_item_id has no FK constraint intentionally,
     * so menu items can be edited/deleted without breaking sale history.
     */
    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function stockDeductions(): HasMany
    {
        return $this->hasMany(StockDeduction::class);
    }
}