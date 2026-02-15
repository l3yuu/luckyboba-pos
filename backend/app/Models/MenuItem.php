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
        'sub_category_id',  // Add this if you have the column
        'name', 
        'price', 
        'barcode'
    ];

    protected $casts = [
        'price' => 'float',
        'category_id' => 'integer',
        'sub_category_id' => 'integer', // Add this
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}