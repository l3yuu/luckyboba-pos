<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'image',
        'price',
        'is_active',
        'sort_order',
        'available_months',  // e.g. null = always, "2" = Feb only, "3,4,5" = Mar-May
    ];

    protected $casts = [
        'price'     => 'float',
        'is_active' => 'boolean',
    ];

    // ── Returns the full image URL ready for the Flutter app ─────────────────
    // If 'image' is already a full URL (http...), return as-is.
    // If it's a relative path (cards/xxx.png), prepend the storage URL.
    public function getImageUrlAttribute(): string
    {
        if (str_starts_with($this->image, 'http')) {
            return $this->image;
        }
        return config('app.url') . '/storage/' . ltrim($this->image, '/');
    }

    // ── Returns available months as an array, or null if always available ────
    public function getAvailableMonthsArrayAttribute(): ?array
    {
        if (empty($this->available_months)) return null;
        return array_map('intval', explode(',', $this->available_months));
    }

    // ── Scope: only active cards ──────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}