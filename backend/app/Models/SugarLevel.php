<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SugarLevel extends Model
{
    protected $fillable = [
        'label',
        'value',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    // Only active levels scope
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Default ordering scope
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
    public function menuItems()
    {
        return $this->belongsToMany(
            \App\Models\MenuItem::class,
            'menu_item_sugar_levels',  // pivot table
            'sugar_level_id',
            'menu_item_id'
        );
    }
}