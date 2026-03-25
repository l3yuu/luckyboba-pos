<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryDrink extends Model
{
    protected $fillable = ['category_id', 'menu_item_id', 'size'];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}