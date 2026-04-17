<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'raw_material_id',
        'ordered_unit',
        'conversion_factor',
        'quantity',
        'quantity_received',
        'unit_cost',
    ];

    protected $casts = [
        'quantity'          => 'float',
        'quantity_received' => 'float',
        'unit_cost'         => 'float',
        'conversion_factor' => 'float',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function receiptItems()
    {
        return $this->hasMany(PurchaseOrderReceiptItem::class, 'purchase_order_item_id');
    }
}