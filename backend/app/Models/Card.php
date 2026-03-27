<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Card extends Model
{
    protected $fillable = [
        'title',
        'price',
        'image',
        'is_active',
        'sort_order',
        'available_months',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'price'      => 'float',
        'sort_order' => 'integer',
    ];

    // Returns a full URL for the image regardless of how it was stored
    public function getImageUrlAttribute(): string
    {
        $image = $this->image ?? '';

        if (empty($image)) {
            return '';
        }

        // Already a full URL (stored by CardController@store)
        if (str_starts_with($image, 'http')) {
            return $image;
        }

        // Relative storage path — prepend storage URL
        return url(Storage::url($image));
    }
}