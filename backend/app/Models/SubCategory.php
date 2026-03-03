<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategory extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'category_id'];

    /**
     * Get the Main Category that owns the sub-category.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the Menu Items associated with this sub-category.
     */
    public function menuItems()
    {
        return $this->hasMany(MenuItem::class, 'sub_category_id');
    }
}