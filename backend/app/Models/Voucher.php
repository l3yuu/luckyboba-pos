<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = [
        'code', 'description', 'value', 'status', 'type', 'receipt', 
        'min_spend', 'max_discount', 'expiry_date', 'usage_limit', 
        'times_used', 'is_active'
    ];

    protected $casts = [
        'expiry_date' => 'datetime',
        'is_active' => 'boolean',
        'min_spend' => 'decimal:2',
        'max_discount' => 'decimal:2',
    ];
}