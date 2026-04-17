<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'po_number',
        'supplier_id',
        'branch_id',
        'total_amount',
        'status',
        'date_ordered',
        'expected_date',
        'notes',
        'created_by_id',
        'approved_by_id',
        'received_by_id',
    ];

    protected $casts = [
        'total_amount'  => 'float',
        'date_ordered'  => 'date',
        'expected_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function receipts()
    {
        return $this->hasMany(PurchaseOrderReceipt::class);
    }
}