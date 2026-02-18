<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 
        'sub_category_id',
        'name', 
        'price', 
        'cost',     // Added to track profit
        'quantity', // Added to track stock
        'barcode'
    ];

    protected $casts = [
        'price' => 'float',
        'cost' => 'float',
        'quantity' => 'integer',
        'category_id' => 'integer',
        'sub_category_id' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}