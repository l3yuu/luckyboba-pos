<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\SubCategory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'category_type', 'cup_id', 'description', 'sub_category_id'];

    public function cup(): BelongsTo
    {
        return $this->belongsTo(Cup::class);
    }

    public function menu_items(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function subCategories()
    {
        return $this->hasMany(SubCategory::class, 'category_id');
    }
}