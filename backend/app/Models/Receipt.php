<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'si_number',
        'terminal',
        'items_count',
        'cashier_name',
        'total_amount',
    ];

    /**
     * The attributes that should be cast.
     * This helps match your TypeScript interface:
     * total_amount becomes a 'number', created_at becomes a string.
     */
    protected $casts = [
        'total_amount' => 'float',
        'items_count' => 'integer',
        'created_at' => 'datetime:Y-m-d H:i:s',
    ];
}