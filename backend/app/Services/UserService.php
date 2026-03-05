<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Exception;

class UserService
{
    /**
     * Get all users with optional filters
     */
    public function getAllUsers($filters = [])
    {
        $query = User::query();

        // Apply filters
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

    /**
     * Get a single user by ID
     */
    public function getUserById($id)
    {
        $user = User::find($id);
        
        if (!$user) {
            throw new Exception('User not found', 404);
        }

        return $user;
    }

    /**
     * Create a new user
     */
    public function createUser($data)
    {
        DB::beginTransaction();
        
        try {
            // Validate unique email
            if (User::where('email', $data['email'])->exists()) {
                throw new Exception('Email already exists', 409);
            }

            // Hash password
            $data['password'] = Hash::make($data['password']);

            // Create user
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'] ?? 'manager',
                'branch_name' => $data['branch'] ?? null,
                'status' => $data['status'] ?? 'ACTIVE',
            ]);

            DB::commit();
            return $user;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing user
     */
    public function updateUser($id, $data)
    {
        DB::beginTransaction();
        
        try {
            $user = $this->getUserById($id);

            // Check email uniqueness (excluding current user)
            if (isset($data['email'])) {
                $existingUser = User::where('email', $data['email'])
                    ->where('id', '!=', $id)
                    ->first();
                
                if ($existingUser) {
                    throw new Exception('Email already exists', 409);
                }
            }

            // Update fields
            $updateData = [];
            
            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
            }
            
            if (isset($data['email'])) {
                $updateData['email'] = $data['email'];
            }
            
            if (isset($data['role'])) {
                $updateData['role'] = $data['role'];
            }
            
            if (isset($data['branch'])) {
                $updateData['branch_name'] = $data['branch'];
            }
            
            if (isset($data['status'])) {
                $updateData['status'] = $data['status'];
            }
            
            // Only update password if provided
            if (isset($data['password']) && !empty(trim($data['password']))) {
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

    /**
     * Delete a user
     */
    public function deleteUser($id)
    {
        DB::beginTransaction();
        
        try {
            $user = $this->getUserById($id);

            // Prevent deleting the last superadmin
            if ($user->role === 'superadmin') {
                $superadminCount = User::where('role', 'superadmin')
                    ->where('status', 'ACTIVE')
                    ->count();
                
                if ($superadminCount <= 1) {
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

    /**
     * Toggle user status
     */
    public function toggleUserStatus($id)
    {
        DB::beginTransaction();
        
        try {
            $user = $this->getUserById($id);
            
            $newStatus = $user->status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            
            // Prevent deactivating the last superadmin
            if ($user->role === 'superadmin' && $newStatus === 'INACTIVE') {
                $activeSuperadminCount = User::where('role', 'superadmin')
                    ->where('status', 'ACTIVE')
                    ->where('id', '!=', $id)
                    ->count();
                
                if ($activeSuperadminCount < 1) {
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

    /**
     * Get user statistics
     */
    public function getUserStats()
    {
        return [
            'total' => User::count(),
            'active' => User::where('status', 'ACTIVE')->count(),
            'inactive' => User::where('status', 'INACTIVE')->count(),
            'by_role' => [
                'superadmin' => User::where('role', 'superadmin')->count(),
                'admin' => User::where('role', 'admin')->count(),
                'manager' => User::where('role', 'manager')->count(),
            ]
        ];
    }
}