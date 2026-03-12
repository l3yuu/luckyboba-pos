<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoidRequest extends Model
{
    protected $fillable = [
        'sale_id',
        'cashier_id',
        'manager_id',
        'branch_id',
        'reason',
        'status',
        'manager_pin_used',
        'approved_at',
        'rejected_at',
        'rejection_reason',
    ];

    public function sale()      { return $this->belongsTo(Sale::class); }
    public function cashier()   { return $this->belongsTo(User::class, 'cashier_id'); }
    public function manager()   { return $this->belongsTo(User::class, 'manager_id'); }
    public function branch()    { return $this->belongsTo(Branch::class); }
}