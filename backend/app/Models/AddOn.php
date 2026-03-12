<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AddOn extends Model
{
    protected $fillable = [
        'name',
        'price',
        'barcode',
        'is_available',
        'category',
    ];

    protected $casts = [
        'price' => 'float',
        'is_available' => 'boolean',
    ];
}