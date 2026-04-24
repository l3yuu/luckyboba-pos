<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeaturedDrink extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'image',
        'cta_text',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];
}
