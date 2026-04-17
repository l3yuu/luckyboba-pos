<?php

namespace App\Models;

use App\Models\RecipeItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $menu_item_id
 * @property string|null $size
 * @property string|null $name
 * @property bool $is_active
 * @property string|null $notes
 * @property float $total_cost
 */
class Recipe extends Model
{
    protected $fillable = [
        'menu_item_id',
        'size',
        'name',
        'is_active',
        'notes',
    ];

    protected $appends = ['total_cost'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    /**
     * Calculate total recipe cost based on base unit costs of raw materials
     */
    public function getTotalCostAttribute(): float
    {
        return $this->items->sum(function ($item) {
            if (!$item->rawMaterial) return 0;
            return (float)$item->quantity * (float)$item->rawMaterial->unit_cost;
        });
    }
}