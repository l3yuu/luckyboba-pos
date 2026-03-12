<?php

namespace App\Http\Controllers\Auth;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Transform user to return branch as a plain string (not object)
     */
    private function transformUser(User $user, ?string $lastLoginAt = null, int $loginCount = 0): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'role'              => $user->role,
            'status'            => $user->status,
            'branch'            => $user->branch_name ?? null,
            'branch_id'         => $user->branch_id,
            'email_verified_at' => $user->email_verified_at,
            'created_at'        => $user->created_at,
            'updated_at'        => $user->updated_at,
            'last_login_at'     => $lastLoginAt,   // ← new
            'login_count'       => $loginCount,    // ← new
        ];
    }

    /**
     * GET /api/users
     */
    public function index(Request $request)
    {
        try {
            $authUser = $request->user();
            $query = User::orderBy('created_at', 'desc');

            if ($authUser->role === 'branch_manager') {
                $query->where('role', 'cashier')
                    ->where('branch_name', $authUser->branch_name);
            }

            if ($request->query('status')) $query->where('status', $request->query('status'));
            if ($request->query('role'))   $query->where('role',   $request->query('role'));
            if ($request->query('branch')) $query->where('branch_name', $request->query('branch'));
            if ($request->query('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $users = $query->get();

            // ── Pull login audit data for all fetched users in one query ──
            $userIds = $users->pluck('id');

            $loginStats = DB::table('audit_logs')
                ->selectRaw('user_id, MAX(created_at) as last_login_at, COUNT(*) as login_count')
                ->whereIn('user_id', $userIds)
                ->where(function ($q) {
                    $q->where('action', 'like', '%logged in%')
                    ->orWhere('action', 'like', '%User logged%')
                    ->orWhere('action', 'like', '%login%');
                })
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id'); // keyed by user_id for O(1) lookup

            $transformed = $users->map(function ($u) use ($loginStats) {
                $stat = $loginStats->get($u->id);
                return $this->transformUser(
                    $u,
                    $stat?->last_login_at ?? null,
                    (int) ($stat?->login_count ?? 0)
                );
            });

            return response()->json([
                'success' => true,
                'data'    => $transformed,
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
    public function show(Request $request, $id)
    {
        try {
            $authUser = $request->user();
            $user = User::findOrFail($id);

            // Branch managers can only view cashiers in their branch
            if ($authUser->role === 'branch_manager') {
                if ($user->role !== 'cashier' || $user->branch_name !== $authUser->branch_name) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. Branch managers can only view cashiers in their branch.',
                    ], 403);
                }
            }

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

    
        $authUser = $request->user();

        // Branch managers can only create cashiers — force the role
        if ($authUser->role === 'branch_manager') {
            $request->merge(['role' => 'cashier']);
        }

        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:superadmin,system_admin,branch_manager,cashier,customer',
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

        \Log::info('UserController@store payload', [
        'all'        => $request->all(),
        'branch'     => $request->branch,
        'has_branch' => $request->has('branch'),
        'filled'     => $request->filled('branch'),
    ]);
            $isBranchManager = $authUser->role === 'branch_manager';

            $branchId   = null;
            $branchName = null;

            if ($isBranchManager) {
                // Always inherit branch from the branch manager
                $branchId   = $authUser->branch_id;
                $branchName = $authUser->branch_name;
            } elseif ($request->has('branch') && $request->branch !== '' && $request->branch !== null) {
    $branch = Branch::where('name', $request->branch)->first();  // ← this line is missing!

    if (! $branch) {
        return response()->json([
            'success' => false,
            'message' => 'Branch not found',
            'error'   => "No branch found with the name: {$request->branch}"
        ], 404);
    }

    $branchId   = $branch->id;
    $branchName = $branch->name;
}

            $user = User::create([
                'name'        => $request->name,
                'email'       => $request->email,
                'password'    => Hash::make($request->password),
                'role'        => $request->role,
                'status'      => $request->status,
                'branch_name' => $branchName,
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
        $authUser = $request->user();
        $target   = User::findOrFail($id);

        // Branch managers can only edit cashiers in their own branch
        if ($authUser->role === 'branch_manager') {
            if ($target->role !== 'cashier' || $target->branch_name !== $authUser->branch_name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Branch managers can only edit cashiers in their branch.',
                ], 403);
            }
            // Prevent role escalation
            $request->merge(['role' => 'cashier']);
        }

        $validator = Validator::make($request->all(), [
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role'     => 'sometimes|required|in:superadmin,system_admin,branch_manager,cashier,customer',
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

                if (! empty($request->branch)) {
                    $branch = Branch::where('name', $request->branch)->first();

                    if (! $branch) {
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

            $target->update($updateData);

            return response()->json([
                'success' => true,
                'data'    => $this->transformUser($target->fresh()),
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
    public function destroy(Request $request, $id)
    {
        try {
            $authUser = $request->user();
            $user     = User::findOrFail($id);

            // Branch managers can only delete cashiers in their own branch
            if ($authUser->role === 'branch_manager') {
                if ($user->role !== 'cashier' || $user->branch_name !== $authUser->branch_name) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. Branch managers can only delete cashiers in their branch.',
                    ], 403);
                }
            }

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

                DB::table('personal_access_tokens')
                    ->where('tokenable_type', get_class($user))
                    ->where('tokenable_id', $user->id)
                    ->delete();

                $tablesWithUserId = [
                    'sales', 'cash_counts', 'cash_transactions',
                    'expenses', 'purchase_orders', 'audit_logs', 'sessions',
                ];

                $schema = DB::getSchemaBuilder();

                foreach ($tablesWithUserId as $table) {
                    if ($schema->hasTable($table) && $schema->hasColumn($table, 'user_id')) {
                        DB::table($table)->where('user_id', $user->id)->update(['user_id' => null]);
                    }
                }

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
    public function toggleStatus(Request $request, $id)
    {
        try {
            $authUser = $request->user();
            $user     = User::findOrFail($id);

            // Branch managers can only toggle cashiers in their own branch
            if ($authUser->role === 'branch_manager') {
                if ($user->role !== 'cashier' || $user->branch_name !== $authUser->branch_name) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. Branch managers can only change status of cashiers in their branch.',
                    ], 403);
                }
            }

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

        AuditHelper::log('user', "Toggled status for user: {$user->name}", "New status: {$user->status}");
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
                    'superadmin'     => User::where('role', 'superadmin')->count(),
                    'system_admin'   => User::where('role', 'system_admin')->count(),
                    'branch_manager' => User::where('role', 'branch_manager')->count(),
                    'cashier'        => User::where('role', 'cashier')->count(),
                    'customer'       => User::where('role', 'customer')->count(),
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