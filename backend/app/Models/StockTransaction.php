<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransaction extends Model
{
    protected $fillable = [
        'menu_item_id', 
        'quantity_change', 
        'type', 
        'remarks'
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
