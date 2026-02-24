<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Exception;

class UserController extends Controller
{
    /**
     * Transform user to return branch as a plain string (not object)
     */
    private function transformUser(User $user): array
    {
        return [
            'id'                 => $user->id,
            'name'               => $user->name,
            'email'              => $user->email,
            'role'               => $user->role,
            'status'             => $user->status,
            'branch'             => $user->branch_name ?? null,
            'branch_id'          => $user->branch_id,
            'email_verified_at'  => $user->email_verified_at,
            'created_at'         => $user->created_at,
            'updated_at'         => $user->updated_at,
        ];
    }

    /**
     * GET /api/users
     */
    public function index(Request $request)
    {
        try {
            $query = User::orderBy('created_at', 'desc');

            if ($request->query('status')) {
                $query->where('status', $request->query('status'));
            }
            if ($request->query('role')) {
                $query->where('role', $request->query('role'));
            }
            if ($request->query('branch')) {
                $query->where('branch_name', $request->query('branch'));
            }
            if ($request->query('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $users = $query->get()->map(fn($u) => $this->transformUser($u));

            return response()->json([
                'success' => true,
                'data'    => $users,
                'message' => 'Users retrieved successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/users/{id}
     */
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);

            return response()->json([
                'success' => true,
                'data'    => $this->transformUser($user),
                'message' => 'User retrieved successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'error'   => $e->getMessage()
            ], 404);
        }
    }

    /**
     * POST /api/users
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:superadmin,admin,manager,cashier',
            'branch'   => 'nullable|string|max:255',
            'status'   => 'required|in:ACTIVE,INACTIVE',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $branchId = null;

            if ($request->filled('branch')) {
                $branch = Branch::where('name', $request->branch)->first();

                if (!$branch) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Branch not found',
                        'error'   => "No branch found with the name: {$request->branch}"
                    ], 404);
                }

                $branchId = $branch->id;
            }

            $user = User::create([
                'name'        => $request->name,
                'email'       => $request->email,
                'password'    => Hash::make($request->password),
                'role'        => $request->role,
                'status'      => $request->status,
                'branch_name' => $request->branch,
                'branch_id'   => $branchId,
            ]);

            return response()->json([
                'success' => true,
                'data'    => $this->transformUser($user),
                'message' => 'User created successfully'
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role'     => 'sometimes|required|in:superadmin,admin,manager,cashier',
            'status'   => 'sometimes|required|in:ACTIVE,INACTIVE',
            'branch'   => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);
            $updateData = [];

            if ($request->has('name'))   $updateData['name']   = $request->name;
            if ($request->has('email'))  $updateData['email']  = $request->email;
            if ($request->has('role'))   $updateData['role']   = $request->role;
            if ($request->has('status')) $updateData['status'] = $request->status;

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            if ($request->has('branch')) {
                $updateData['branch_name'] = $request->branch;

                if (!empty($request->branch)) {
                    $branch = Branch::where('name', $request->branch)->first();

                    if (!$branch) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Branch not found',
                            'error'   => "No branch found with the name: {$request->branch}"
                        ], 404);
                    }

                    $updateData['branch_id'] = $branch->id;
                } else {
                    $updateData['branch_id'] = null;
                }
            }

            $user->update($updateData);

            return response()->json([
                'success' => true,
                'data'    => $this->transformUser($user->fresh()),
                'message' => 'User updated successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error'   => $e->getMessage()
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

            // Block deleting superadmin
            if ($user->role === 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete super admin users.',
                ], 403);
            }

            // Block self-deletion
            if (Auth::id() === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account.',
                ], 403);
            }

            DB::transaction(function () use ($user) {

                // 1. Delete Sanctum tokens (uses tokenable_id, NOT user_id)
                DB::table('personal_access_tokens')
                    ->where('tokenable_type', get_class($user))
                    ->where('tokenable_id', $user->id)
                    ->delete();

                // 2. Nullify user_id on tables that reference users
                //    hasColumn check prevents crash if a table doesn't exist yet
                $tablesWithUserId = [
                    'sales',
                    'cash_counts',
                    'cash_transactions',
                    'expenses',
                    'purchase_orders',
                    'audit_logs',
                    'sessions',
                ];

                $schema = DB::getSchemaBuilder();

                foreach ($tablesWithUserId as $table) {
                    if (
                        $schema->hasTable($table) &&
                        $schema->hasColumn($table, 'user_id')
                    ) {
                        DB::table($table)
                            ->where('user_id', $user->id)
                            ->update(['user_id' => null]);
                    }
                }

                // 3. Delete the user
                $user->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error'   => $e->getMessage()
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
                'data'    => $this->transformUser($user),
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
            $stats = [
                'total'    => User::count(),
                'active'   => User::where('status', 'ACTIVE')->count(),
                'inactive' => User::where('status', 'INACTIVE')->count(),
                'by_role'  => [
                    'superadmin' => User::where('role', 'superadmin')->count(),
                    'admin'      => User::where('role', 'admin')->count(),
                    'manager'    => User::where('role', 'manager')->count(),
                    'cashier'    => User::where('role', 'cashier')->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data'    => $stats,
                'message' => 'User statistics retrieved successfully'
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}