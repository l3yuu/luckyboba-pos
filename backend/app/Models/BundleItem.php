<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 
class BundleItem extends Model
{
    protected $fillable = [
        'bundle_id',
        'menu_item_id',
        'custom_name',
        'quantity',
        'size',
    ];
 
    public function bundle(): BelongsTo
    {
        return $this->belongsTo(Bundle::class);
    }
 
    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
 
    // Always gives you a display name regardless of which field is set
    public function getDisplayNameAttribute(): string
    {
        return $this->menuItem?->name ?? $this->custom_name ?? '—';
    }
}
