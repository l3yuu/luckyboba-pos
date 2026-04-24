<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderReceipt extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'branch_id',
        'received_by_id',
        'reference_number',
        'notes',
        'total_amount_received',
        'received_at',
    ];

    protected $casts = [
        'total_amount_received' => 'float',
        'received_at'           => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function receiptItems()
    {
        return $this->hasMany(PurchaseOrderReceiptItem::class, 'purchase_order_receipt_id');
    }
}
