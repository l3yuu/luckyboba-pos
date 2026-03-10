<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Exception;

class UserService
{
    public function getAllUsers($filters = [])
    {
        $query = User::query();

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['role'])) {
            $query->where('role', $filters['role']);
        }
        if (isset($filters['branch'])) {
            $query->where('branch_name', $filters['branch']);
        }
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function getUserById($id)
    {
        $user = User::find($id);
        if (!$user) {
            throw new Exception('User not found', 404);
        }
        return $user;
    }

    public function createUser($data)
    {
        DB::beginTransaction();
        try {
            if (User::where('email', $data['email'])->exists()) {
                throw new Exception('Email already exists', 409);
            }

            $user = User::create([
                'name'        => $data['name'],
                'email'       => $data['email'],
                'password'    => Hash::make($data['password']),
                'role'        => $data['role'] ?? 'cashier',
                'branch_name' => isset($data['branch']) && $data['branch'] !== '' ? $data['branch'] : null,
                'status'      => $data['status'] ?? 'ACTIVE',
            ]);

            DB::commit();
            return $user;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateUser($id, $data)
    {
        DB::beginTransaction();
        try {
            $user = $this->getUserById($id);

            if (isset($data['email'])) {
                $existing = User::where('email', $data['email'])
                    ->where('id', '!=', $id)->first();
                if ($existing) {
                    throw new Exception('Email already exists', 409);
                }
            }

            $updateData = [];

            if (isset($data['name']))  $updateData['name']  = $data['name'];
            if (isset($data['email'])) $updateData['email'] = $data['email'];
            if (isset($data['role']))  $updateData['role']  = $data['role'];
            if (isset($data['status'])) $updateData['status'] = $data['status'];

            // Use array_key_exists so an empty string clears the branch
            // (isset() returns false for empty strings when you want to allow clearing)
            if (array_key_exists('branch', $data)) {
                $updateData['branch_name'] = ($data['branch'] !== '' && $data['branch'] !== null)
                    ? $data['branch']
                    : null;
            }

            if (isset($data['password']) && trim($data['password']) !== '') {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            DB::commit();
            return $user->fresh();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function deleteUser($id)
    {
        DB::beginTransaction();
        try {
            $user = $this->getUserById($id);

            if ($user->role === 'superadmin') {
                $count = User::where('role', 'superadmin')->where('status', 'ACTIVE')->count();
                if ($count <= 1) {
                    throw new Exception('Cannot delete the last active superadmin', 403);
                }
            }

            $user->delete();
            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleUserStatus($id)
    {
        DB::beginTransaction();
        try {
            $user = $this->getUserById($id);
            $newStatus = $user->status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

            if ($user->role === 'superadmin' && $newStatus === 'INACTIVE') {
                $activeCount = User::where('role', 'superadmin')
                    ->where('status', 'ACTIVE')
                    ->where('id', '!=', $id)
                    ->count();
                if ($activeCount < 1) {
                    throw new Exception('Cannot deactivate the last active superadmin', 403);
                }
            }

            $user->update(['status' => $newStatus]);
            DB::commit();
            return $user->fresh();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getUserStats()
    {
        return [
            'total'    => User::count(),
            'active'   => User::where('status', 'ACTIVE')->count(),
            'inactive' => User::where('status', 'INACTIVE')->count(),
            'by_role'  => [
                'superadmin' => User::where('role', 'superadmin')->count(),
                'cashier'    => User::where('role', 'cashier')->count(),
                'branch_manager' => User::where('role', 'branch_manager')->count(),
            ]
        ];
    }
}