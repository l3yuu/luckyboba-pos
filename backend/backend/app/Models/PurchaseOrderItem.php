<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = ['purchase_order_id', 'menu_item_id', 'quantity', 'unit_cost'];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}