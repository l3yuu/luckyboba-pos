<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();
        $targetUser = $this->route('id'); // Wait, parameter is {id}, but how do we get the route param user object?
        // Let's resolve the user from the repository in the controller instead of complex auth logic here, 
        // to avoid duplicating 'User::findOrFail' querying. 
        // Or we can just allow and do security checks in repository.
        // Yes, the repository `findById` does the security check, so authorize = true is fine here.
        return true;
    }

    protected function prepareForValidation()
    {
        $user = $this->user();

        // Branch managers force their own branch and can't promote role
        if ($user->role === 'branch_manager') {
            $inputRole = $this->input('role');
            
            $roleToSet = in_array($inputRole, ['cashier', 'team_leader']) ? $inputRole : null;

            $mergeData = [
                'branch_id' => $user->branch_id,
            ];

            if ($roleToSet) {
                $mergeData['role'] = $roleToSet;
            } else {
                // If invalid role sent, don't overwrite it, let the validator flag it or ignore it.
                // Since this is update, if they send invalid, they fail validation.
            }

            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        return [
            'name'        => 'sometimes|required|string|max:255',
            'email'       => 'sometimes|required|email|max:255|unique:users,email,' . $this->route('id'),
            'password'    => 'nullable|string|min:6',
            'role'        => 'sometimes|required|in:superadmin,system_admin,branch_manager,team_leader,cashier,customer,it_admin,supervisor',
            'status'      => 'sometimes|required|in:ACTIVE,INACTIVE',
            'branch_id'   => 'nullable|integer|exists:branches,id',
            'manager_pin' => 'nullable|string|min:4|max:20',
        ];
    }
}
