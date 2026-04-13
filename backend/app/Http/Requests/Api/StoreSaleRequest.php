<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'si_number'              => 'required|string',
            'items'                  => 'required|array|min:1',
            'items.*.menu_item_id'   => 'nullable|exists:menu_items,id',
            'items.*.bundle_id'      => 'nullable|exists:bundles,id',
            'items.*.name'           => 'required|string',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.unit_price'     => 'required|numeric|min:0',
            'items.*.total_price'    => 'required|numeric|min:0',
            'items.*.size'           => 'nullable|string',
            'items.*.cup_size_label' => 'nullable|string',
            'items.*.sugar_level'    => 'nullable|string',
            'items.*.options'        => 'nullable|array',
            'items.*.add_ons'        => 'nullable|array',
            'items.*.remarks'        => 'nullable|string',
            'items.*.charges'        => 'nullable|array',
            'items.*.charges.grab'   => 'nullable|boolean',
            'items.*.charges.panda'  => 'nullable|boolean',
            'items.*.discount_id'    => 'nullable|integer',
            'items.*.discount_label' => 'nullable|string',
            'items.*.discount_type'  => 'nullable|string',
            'items.*.discount_value' => 'nullable|numeric|min:0',
            'subtotal'               => 'required|numeric|min:0',
            'total'                  => 'required|numeric|min:0',
            'cashier_name'           => 'nullable|string',
            'payment_method'         => 'nullable|string',
            'reference_number'       => 'nullable|string',
            'discount_id'            => 'nullable|exists:discounts,id',
            'discount_amount'        => 'nullable|numeric|min:0',
            'sc_discount_amount'     => 'nullable|numeric|min:0',
            'pwd_discount_amount'    => 'nullable|numeric|min:0',
            'diplomat_discount_amount' => 'nullable|numeric|min:0',
            'other_discount_amount'  => 'nullable|numeric|min:0',
            'discount_remarks'       => 'nullable|string',
            'vatable_sales'          => 'required|numeric',
            'vat_amount'             => 'required|numeric',
            'vat_type'               => 'nullable|in:vat,non_vat',
            'customer_name'          => 'nullable|string',
            'cash_tendered'          => 'nullable|numeric|min:0',
            'pax_discount_ids'       => 'nullable|string',
            'pax_senior'             => 'nullable|integer|min:0',
            'pax_pwd'                => 'nullable|integer|min:0',
            'senior_id'              => 'nullable|string',
            'pwd_id'                 => 'nullable|string',
        ];
    }
}
