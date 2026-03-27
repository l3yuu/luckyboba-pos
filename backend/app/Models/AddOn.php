<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AddOn extends Model
{
    protected $fillable = [
        'name',
        'price',
        'grab_price',
        'panda_price',
        'barcode',
        'is_available',
        'category',
    ];

    protected $casts = [
        'price'        => 'float',
        'grab_price'   => 'float',
        'panda_price'  => 'float',
        'is_available' => 'boolean',
    ];
}