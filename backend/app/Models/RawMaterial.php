<?php

namespace App\Models;

use App\Models\RawMaterialLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $unit
 * @property string|null $purchase_unit
 * @property float $purchase_to_base_factor
 * @property float $last_purchase_price
 * @property float $unit_cost
 * @property string $category
 * @property float $current_stock
 * @property float $reorder_level
 * @property bool $is_intermediate
 * @property string|null $notes
 * @property int|null $branch_id
 * @property int|null $parent_id
 */
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
        'unit_cost',
    ];

    protected $appends = ['incoming_stock'];

    protected $casts = [
        'current_stock'            => 'decimal:4',
        'reorder_level'            => 'decimal:4',
        'purchase_to_base_factor'  => 'decimal:4',
        'last_purchase_price'      => 'decimal:2',
        'unit_cost'                => 'decimal:4',
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

    /**
     * Update the base unit cost using Weighted Average Cost (WAC)
     */
    /**
     * Update the base unit cost using Weighted Average Cost (WAC)
     */
    public function updateBaseCost(float $newBaseQty, float $newPurchasePrice)
    {
        // 1. Calculate incoming base cost
        $factor = (float)$this->purchase_to_base_factor;
        if ($factor <= 0) $factor = 1;
        
        $newBaseCost = $newPurchasePrice / $factor;
        
        $oldStock = (float)$this->current_stock;
        $oldCost  = (float)$this->unit_cost;
        
        // 2. Special case: If stock is 0 or negative, just use newest price
        if ($oldStock <= 0) {
            $this->unit_cost = $newBaseCost;
        } else {
            // 3. WAC Formula
            $totalStock   = $oldStock + $newBaseQty;
            $newWacCost   = (($oldStock * $oldCost) + ($newBaseQty * $newBaseCost)) / $totalStock;
            $this->unit_cost = $newWacCost;
        }

        $this->last_purchase_price = $newPurchasePrice;
        $this->save();
    }

    /**
     * Centralized method to record stock movements with point-in-time snapshots.
     */
    public function recordMovement(float $qtyChange, string $type, string $reason, ?int $userId = null): void
    {
        $before = (float) $this->current_stock;

        if ($type === 'add') {
            $this->increment('current_stock', $qtyChange);
        } else {
            $this->decrement('current_stock', $qtyChange);
        }

        // Refresh the instance attribute for the after-snapshot
        $after = (float) $this->current_stock;

        StockMovement::create([
            'raw_material_id' => $this->id,
            'branch_id'       => $this->branch_id,
            'user_id'         => $userId ?? auth()->id(),
            'before_stock'    => $before,
            'after_stock'     => $after,
            'type'            => $type,
            'quantity'        => $qtyChange,
            'reason'          => $reason,
        ]);
    }
}