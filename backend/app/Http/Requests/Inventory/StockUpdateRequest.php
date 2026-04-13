<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StockUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is handled safely within the repository level 
        // to prevent duplicate query lookups.
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => 'required|integer',
        ];
    }
}
