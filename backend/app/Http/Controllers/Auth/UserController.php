<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller; // ✅ Import Controller from parent namespace
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display a listing of users
     * GET /api/users
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'status' => $request->query('status'),
                'role' => $request->query('role'),
                'branch' => $request->query('branch'),
                'search' => $request->query('search'),
            ];

            $users = $this->userService->getAllUsers($filters);

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
     * Display the specified user
     * GET /api/users/{id}
     */
    public function show($id)
    {
        try {
            $user = $this->userService->getUserById($id);

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User retrieved successfully'
            ], 200);
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Store a newly created user
     * POST /api/users
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:superadmin,admin,manager',
            'branch' => 'nullable|string|max:255',
            'status' => 'nullable|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $this->userService->createUser($request->all());

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User created successfully'
            ], 201);
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Update the specified user
     * PUT/PATCH /api/users/{id}
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255',
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|required|in:superadmin,admin,manager',
            'branch' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $this->userService->updateUser($id, $request->all());

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User updated successfully'
            ], 200);
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Remove the specified user
     * DELETE /api/users/{id}
     */
    public function destroy($id)
    {
        try {
            $this->userService->deleteUser($id);

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ], 200);
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Toggle user status
     * PATCH /api/users/{id}/toggle-status
     */
    public function toggleStatus($id)
    {
        try {
            $user = $this->userService->toggleUserStatus($id);

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User status updated successfully'
            ], 200);
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Get user statistics
     * GET /api/users/stats
     */
    public function stats()
    {
        try {
            $stats = $this->userService->getUserStats();

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