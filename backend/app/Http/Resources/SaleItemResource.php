<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'sale_id'           => $this->sale_id,
            'menu_item_id'      => $this->menu_item_id,
            'bundle_id'         => $this->bundle_id,
            'product_name'      => $this->product_name,
            'quantity'          => $this->quantity,
            'unit_price'        => (float) $this->unit_price,
            'price'             => (float) $this->price,
            'final_price'       => (float) $this->final_price,
            'size'              => $this->size,
            'cup_size_label'    => $this->cup_size_label,
            'sugar_level'       => $this->sugar_level,
            'options'           => $this->options,
            'add_ons'           => $this->add_ons,
            'bundle_components' => $this->bundle_components ? json_decode($this->bundle_components, true) : null,
            'charge_type'       => $this->charge_type,
            'surcharge'         => (float) $this->surcharge,
            'discount_id'       => $this->discount_id,
            'discount_label'    => $this->discount_label,
            'discount_type'     => $this->discount_type,
            'discount_value'    => $this->discount_value,
            'discount_amount'   => (float) $this->discount_amount,
        ];
    }
}
