<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockDeduction extends Model
{
    protected $fillable = [
        'sale_id',
        'sale_item_id',
        'raw_material_id',
        'recipe_item_id',
        'quantity_deducted',
    ];

    protected $casts = [
        'quantity_deducted' => 'decimal:4',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function recipeItem(): BelongsTo
    {
        return $this->belongsTo(RecipeItem::class);
    }
}