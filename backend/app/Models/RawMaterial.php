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
        'purchase_unit',
        'purchase_to_base_factor',
        'last_purchase_price',
        'category',
        'current_stock',
        'reorder_level',
        'is_intermediate',
        'notes',
        'branch_id',
        'parent_id',
    ];

    protected $appends = ['incoming_stock'];

    protected $casts = [
        'current_stock'            => 'decimal:4',
        'reorder_level'            => 'decimal:4',
        'purchase_to_base_factor'  => 'decimal:4',
        'last_purchase_price'      => 'decimal:2',
        'is_intermediate'          => 'boolean',
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

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getIncomingStockAttribute(): float
    {
        // 1. Pending from Purchase Orders
        $poIncoming = (float) $this->purchaseOrderItems()
            ->whereHas('purchaseOrder', function ($q) {
                $q->whereIn('status', ['Approved', 'Partially Received'])
                   ->where('branch_id', $this->branch_id);
            })
            ->get()
            ->sum(fn($i) => ($i->quantity - $i->quantity_received) * $i->conversion_factor);

        // 2. Pending from Stock Transfers
        $parentId = $this->parent_id ?? $this->id;
        $transferIncoming = (float) StockTransferItem::whereHas('stockTransfer', function ($q) {
                $q->whereIn('status', ['Approved', 'In Transit'])
                   ->where('to_branch_id', $this->branch_id);
            })
            ->whereHas('rawMaterial', function ($q) use ($parentId) {
                $q->where('id', $parentId)
                  ->orWhere('parent_id', $parentId);
            })
            ->get()
            ->sum(fn($i) => (float) ($i->quantity * ($i->conversion_factor ?? 1)));

        return $poIncoming + $transferIncoming;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isBelowReorderLevel(): bool
    {
        return $this->current_stock <= $this->reorder_level;
    }
}