<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = ['category_id', 'name', 'price', 'barcode'];

    /**
     * The attributes that should be cast.
     * This ensures the frontend receives numbers, not strings.
     */
    protected $casts = [
        'price' => 'float',
        'category_id' => 'integer'
    ];

    /**
     * Relationship: A menu item belongs to a specific category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}