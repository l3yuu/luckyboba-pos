<?php

namespace App\Http\Requests\Users;

use App\Models\Branch;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user->role === 'it_admin' && $this->input('role') === 'superadmin') {
            return false;
        }

        return true;
    }

    protected function prepareForValidation()
    {
        $user = $this->user();

        // Branch managers force their own branch and role
        if ($user->role === 'branch_manager') {
            $inputRole = $this->input('role');
            $role = in_array($inputRole, ['cashier', 'team_leader', 'supervisor']) ? $inputRole : 'cashier';

            $this->merge([
                'role'        => $role,
                'branch_id'   => $user->branch_id,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|max:255|unique:users,email',
            'password'    => 'required|string|min:6',
            'role'        => 'required|in:superadmin,system_admin,branch_manager,team_leader,cashier,customer,it_admin,supervisor',
            'branch_id'   => 'nullable|integer|exists:branches,id',
            'status'      => 'required|in:ACTIVE,INACTIVE',
            'manager_pin' => 'nullable|digits_between:4,8',
        ];
    }
}
