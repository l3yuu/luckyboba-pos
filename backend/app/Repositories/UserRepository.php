<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Build a scoped query based on the authenticated user's role.
     */
    private function getScopedQuery()
    {
        $authUser = Auth::user();
        $query = User::query();

        if ($authUser->role === 'branch_manager') {
            $query->whereIn('role', ['cashier', 'team_leader', 'supervisor'])
                  ->where('branch_id', $authUser->branch_id);
        }

        if ($authUser->role === 'it_admin') {
            $query->where('role', '!=', 'superadmin');
        }

        return $query;
    }

    public function getAll(array $filters = []): Collection
    {
        $query = $this->getScopedQuery()->orderBy('created_at', 'desc');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }
        if (!empty($filters['branch'])) {
            $query->where('branch_name', $filters['branch']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }

    public function findById(int $id): User
    {
        $user = User::findOrFail($id);
        $authUser = Auth::user();

        // Security check
        if ($authUser->role === 'branch_manager') {
            if (!in_array($user->role, ['cashier', 'team_leader', 'supervisor']) || $user->branch_id !== $authUser->branch_id) {
                throw new AccessDeniedHttpException('Access denied. You can only view staff in your branch.');
            }
        }

        if ($authUser->role === 'it_admin' && $user->role === 'superadmin') {
            throw new AccessDeniedHttpException('Access denied. IT Admin cannot view superadmin accounts.');
        }

        return $user;
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user;
    }

    public function delete(User $user): void
    {
        $authUser = Auth::user();

        if ($user->role === 'superadmin') {
            throw new AccessDeniedHttpException('Cannot delete super admin users.');
        }

        if ($authUser->id === $user->id) {
            throw new AccessDeniedHttpException('You cannot delete your own account.');
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
    }

    public function toggleStatus(User $user): User
    {
        $user->status = $user->status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        $user->save();
        return $user;
    }

    public function getStats(): array
    {
        return [
            'total'    => User::count(),
            'active'   => User::where('status', 'ACTIVE')->count(),
            'inactive' => User::where('status', 'INACTIVE')->count(),
            'by_role'  => [
                'superadmin'     => User::where('role', 'superadmin')->count(),
                'system_admin'   => User::where('role', 'system_admin')->count(),
                'branch_manager' => User::where('role', 'branch_manager')->count(),
                'team_leader'    => User::where('role', 'team_leader')->count(),
                'cashier'        => User::where('role', 'cashier')->count(),
                'customer'       => User::where('role', 'customer')->count(),
                'it_admin'       => User::where('role', 'it_admin')->count(),
            ],
        ];
    }
}
