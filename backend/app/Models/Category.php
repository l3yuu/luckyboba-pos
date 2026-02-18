<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type'];

    /**
     * For the React Frontend (api.php)
     */
    public function menu_items(): HasMany 
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * For the MenuSeeder.php
     * Used by: $category->menuItems()->updateOrCreate(...)
     */
    public function menuItems(): HasMany 
    {
        return $this->hasMany(MenuItem::class);
    }
}