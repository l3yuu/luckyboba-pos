<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportFilterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'from'      => 'nullable|date',
            'to'        => 'nullable|date|after_or_equal:from',
            'date'      => 'nullable|date',
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
            'type'      => 'nullable|string',
            'period'    => 'nullable|string|in:daily,weekly,monthly',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ];
    }

    /**
     * Standardize the resolution of the branch ID based on the user's role and query params.
     */
    public function resolveBranchId(): ?int
    {
        $user = $this->user('sanctum') ?? $this->user();
        $qb   = $this->query('branch_id');

        if ($qb !== null && $qb !== '') {
            $id = (int) $qb;
            return $id > 0 ? $id : null;
        }

        if ($user?->branch_id) {
            return (int) $user->branch_id;
        }

        return null;
    }
}
