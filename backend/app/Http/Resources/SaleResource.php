<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'user_id'                  => $this->user_id,
            'branch_id'                => $this->branch_id,
            'invoice_number'           => $this->invoice_number,
            'total_amount'             => (float) $this->total_amount,
            'status'                   => $this->status,
            'payment_method'           => $this->payment_method,
            'reference_number'         => $this->reference_number,
            'charge_type'              => $this->charge_type,
            'discount_id'              => $this->discount_id,
            'discount_amount'          => (float) $this->discount_amount,
            'sc_discount_amount'       => (float) $this->sc_discount_amount,
            'pwd_discount_amount'      => (float) $this->pwd_discount_amount,
            'diplomat_discount_amount' => (float) $this->diplomat_discount_amount,
            'other_discount_amount'    => (float) $this->other_discount_amount,
            'vatable_sales'            => (float) $this->vatable_sales,
            'vat_amount'               => (float) $this->vat_amount,
            'vat_exempt_sales'         => (float) $this->vat_exempt_sales,
            'vat_type'                 => $this->vat_type,
            'customer_name'            => $this->customer_name,
            'cash_tendered'            => (float) $this->cash_tendered,
            'pax_senior'               => $this->pax_senior,
            'pax_pwd'                  => $this->pax_pwd,
            'senior_id'                => $this->senior_id,
            'pwd_id'                   => $this->pwd_id,
            'pax_discount_ids'         => $this->pax_discount_ids,
            'is_synced'                => (bool) $this->is_synced,
            'cancellation_reason'      => $this->cancellation_reason,
            'cancelled_at'             => $this->cancelled_at,
            'created_at'               => $this->created_at,
            'updated_at'               => $this->updated_at,
            'items'                    => SaleItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
