<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'recorded_by',
        'supplier_id',
        'purchase_order_id',
        'ref_num',
        'title',
        'notes',
        'date',
        'due_date',
        'category',
        'amount',
        'payment_status',
        'payment_method',
        'receipt_path'
    ];

    protected $casts = [
        'amount'    => 'float',
        'date'      => 'date:Y-m-d',
        'branch_id' => 'integer'
    ];

    /**
     * Get the branch that the expense belongs to.
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user who recorded the expense.
     */
    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}