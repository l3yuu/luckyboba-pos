<?php

namespace App\Http\Controllers\Auth;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Branch;
use App\Repositories\UserRepositoryInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class UserController extends Controller
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * GET /api/users
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['status', 'role', 'branch', 'search']);
            $users = $this->userRepository->getAll($filters);
            $resourceCollection = UserResource::collectionWithStats($users);

            return response()->json([
                'success' => true,
                'data'    => $resourceCollection,
                'message' => 'Users retrieved successfully',
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/users/{id}
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $this->userRepository->findById($id);

            return response()->json([
                'success' => true,
                'data'    => new UserResource($user),
                'message' => 'User retrieved successfully',
            ], 200);

        } catch (AccessDeniedHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'error'   => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * POST /api/users
     */
    public function store(StoreUserRequest $request)
    {
        try {
            $data = $request->validated();
            
            // Hash passwords before creation
            $data['password'] = Hash::make($data['password']);
            if (!empty($data['manager_pin'])) {
                $data['manager_pin'] = Hash::make($data['manager_pin']);
            }

            // Fetch branch name if branch_id is provided
            if (!empty($data['branch_id'])) {
                $branch = Branch::find($data['branch_id']);
                if (!$branch) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Branch not found.',
                    ], 404);
                }
                $data['branch_name'] = $branch->name;
            }

            $user = $this->userRepository->create($data);

            return response()->json([
                'success' => true,
                'data'    => new UserResource($user),
                'message' => 'User created successfully',
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(UpdateUserRequest $request, $id)
    {
        try {
            // Retrieve via repository to implicitly perform branch security check
            $targetUser = $this->userRepository->findById($id);
            
            $data = $request->validated();

            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            if (isset($data['manager_pin'])) {
                if (!empty($data['manager_pin'])) {
                    $data['manager_pin'] = Hash::make($data['manager_pin']);
                } else {
                    $data['manager_pin'] = null;
                }
            }

            if (array_key_exists('branch_id', $data)) {
                if (!empty($data['branch_id'])) {
                    $branch = Branch::find($data['branch_id']);
                    if (!$branch) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Branch not found.',
                        ], 404);
                    }
                    $data['branch_name'] = $branch->name;
                } else {
                    $data['branch_id'] = null;
                    $data['branch_name'] = null;
                }
            }

            $updatedUser = $this->userRepository->update($targetUser, $data);

            return response()->json([
                'success' => true,
                'data'    => new UserResource($updatedUser->fresh()),
                'message' => 'User updated successfully',
            ], 200);

        } catch (AccessDeniedHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $this->userRepository->findById($id);
            $this->userRepository->delete($user);

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ], 200);

        } catch (AccessDeniedHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/users/{id}/toggle-status
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $user = $this->userRepository->findById($id);
            $updatedUser = $this->userRepository->toggleStatus($user);

            AuditHelper::log('user', "Toggled status for user: {$updatedUser->name}", "New status: {$updatedUser->status}");

            return response()->json([
                'success' => true,
                'data'    => new UserResource($updatedUser),
                'message' => 'User status updated successfully',
            ], 200);

        } catch (AccessDeniedHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/users/stats
     */
    public function stats()
    {
        try {
            $stats = $this->userRepository->getStats();

            return response()->json([
                'success' => true,
                'data'    => $stats,
                'message' => 'User statistics retrieved successfully',
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/users/{id}/pin
     */
    public function updatePin(Request $request, $id)
    {
        try {
            // Find user explicitly bypassing repository scope since users can update their own pin
            $user = User::findOrFail($id);
            $authUser = Auth::user();

            if ($authUser->id !== $user->id && $authUser->role !== 'superadmin') {
                return response()->json(['message' => 'Unauthorized to update this PIN.'], 403);
            }

            if ($user->role === 'superadmin' && $authUser->role !== 'superadmin') {
                 return response()->json(['message' => 'Only a SuperAdmin can update a SuperAdmin PIN.'], 403);
            }

            $request->validate([
                'pin'              => ['required', 'digits_between:4,8', 'confirmed'],
                'pin_confirmation' => ['required'],
            ]);

            $user->update(['manager_pin' => Hash::make($request->pin)]);

            AuditHelper::log('user', "Updated PIN for user: {$user->name}", "ID: {$user->id}");

            return response()->json(['message' => 'PIN updated successfully.']);
        } catch (Exception $e) {
            return response()->json(['message' => 'Internal server error', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/auth/verify-manager-pin
     */
    public function verifyManagerPin(Request $request)
    {
        $request->validate(['pin' => 'required|string']);
        $authUser = Auth::user();

        // 🛡️ SECURITY: Scope check to the requester's branch unless they are SuperAdmin.
        $query = User::whereIn('role', ['superadmin', 'system_admin', 'branch_manager', 'team_leader', 'it_admin'])
            ->where('status', 'ACTIVE')
            ->whereNotNull('manager_pin');

        if ($authUser->role !== 'superadmin') {
            $query->where('branch_id', $authUser->branch_id);
        }

        $admins = $query->get();

        foreach ($admins as $admin) {
            if (Hash::check($request->pin, $admin->manager_pin)) {
                return response()->json([
                    'success' => true, 
                    'message' => 'Authorized',
                    'auth_by' => $admin->name
                ]);
            }
        }

        return response()->json(['success' => false, 'message' => 'Incorrect PIN.'], 401);
    }
}