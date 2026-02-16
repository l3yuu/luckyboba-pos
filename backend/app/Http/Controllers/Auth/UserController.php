<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Exception;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * GET /api/users
     * Display a listing of users with filters
     */
    public function index(Request $request)
    {
        try {

            // OPTIONAL: use service if you built filtering there
            $filters = [
                'status' => $request->query('status'),
                'role' => $request->query('role'),
                'branch' => $request->query('branch'),
                'search' => $request->query('search'),
            ];

            if (method_exists($this->userService, 'getAllUsers')) {
                $users = $this->userService->getAllUsers($filters);
            } else {
                // fallback query
                $query = User::with('branch')->orderBy('created_at', 'desc');

                if ($filters['status']) {
                    $query->where('status', $filters['status']);
                }

                if ($filters['role']) {
                    $query->where('role', $filters['role']);
                }

                if ($filters['branch']) {
                    $query->where('branch_name', $filters['branch']);
                }

                if ($filters['search']) {
                    $query->where(function ($q) use ($filters) {
                        $q->where('name', 'like', '%' . $filters['search'] . '%')
                          ->orWhere('email', 'like', '%' . $filters['search'] . '%');
                    });
                }

                $users = $query->get();
            }

            return response()->json([
                'success' => true,
                'data' => $users,
                'message' => 'Users retrieved successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/users/{id}
     */
    public function show($id)
    {
        try {

            $user = User::with('branch')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User retrieved successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * POST /api/users
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:superadmin,admin,manager,cashier',
            'branch' => 'nullable|string|max:255',
            'status' => 'required|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {

            // find branch
            $branchId = null;

            if ($request->filled('branch')) {

                $branch = Branch::where('name', $request->branch)->first();

                if (!$branch) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Branch not found',
                        'error' => "No branch found with the name: {$request->branch}"
                    ], 404);
                }

                $branchId = $branch->id;
            }

            // create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'status' => $request->status,
                'branch_name' => $request->branch,
                'branch_id' => $branchId,
            ]);

            $user->load('branch');

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User created successfully'
            ], 201);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT/PATCH /api/users/{id}
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|required|in:superadmin,admin,manager,cashier',
            'status' => 'sometimes|required|in:ACTIVE,INACTIVE',
            'branch' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {

            $user = User::findOrFail($id);

            $updateData = [];

            if ($request->has('name')) $updateData['name'] = $request->name;
            if ($request->has('email')) $updateData['email'] = $request->email;
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }
            if ($request->has('role')) $updateData['role'] = $request->role;
            if ($request->has('status')) $updateData['status'] = $request->status;

            // branch handling
            if ($request->has('branch')) {

                $updateData['branch_name'] = $request->branch;

                if (!empty($request->branch)) {

                    $branch = Branch::where('name', $request->branch)->first();

                    if (!$branch) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Branch not found',
                            'error' => "No branch found with the name: {$request->branch}"
                        ], 404);
                    }

                    $updateData['branch_id'] = $branch->id;
                } else {
                    $updateData['branch_id'] = null;
                }
            }

            $user->update($updateData);
            $user->load('branch');

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User updated successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy($id)
    {
        try {

            $user = User::findOrFail($id);

            if ($user->role === 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete super admin users',
                ], 403);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PATCH /api/users/{id}/toggle-status
     */
    public function toggleStatus($id)
    {
        try {

            $user = User::findOrFail($id);

            $user->status = $user->status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            $user->save();

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User status updated successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/users/stats
     */
    public function stats()
    {
        try {

            if (method_exists($this->userService, 'getUserStats')) {
                $stats = $this->userService->getUserStats();
            } else {
                $stats = [
                    'total' => User::count(),
                    'active' => User::where('status', 'ACTIVE')->count(),
                    'inactive' => User::where('status', 'INACTIVE')->count(),
                    'admins' => User::whereIn('role', ['admin','superadmin'])->count(),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'User statistics retrieved successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
