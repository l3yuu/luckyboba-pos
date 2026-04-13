<?php

namespace App\Models;

use App\Models\PurchaseOrderItem;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = ['po_number', 'supplier', 'total_amount', 'status', 'date_ordered', 'branch_id'];
    
    protected $casts = [
        'total_amount' => 'float',
        'date_ordered' => 'date:Y-m-d'
    ];

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}