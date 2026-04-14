<?php

namespace App\Models;

use App\Models\RawMaterialLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    protected $fillable = [
        'name',
        'unit',
        'category',
        'current_stock',
        'reorder_level',
        'is_intermediate',
        'notes',
        'branch_id',
        'parent_id',
    ];

    protected $casts = [
        'current_stock'   => 'decimal:4',
        'reorder_level'   => 'decimal:4',
        'is_intermediate' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function branchStocks(): HasMany
    {
        return $this->hasMany(RawMaterial::class, 'parent_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(RawMaterialLog::class);
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function stockDeductions(): HasMany
    {
        return $this->hasMany(StockDeduction::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isBelowReorderLevel(): bool
    {
        return $this->current_stock <= $this->reorder_level;
    }
}