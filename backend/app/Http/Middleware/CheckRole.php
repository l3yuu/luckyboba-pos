<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Protected roles for Lucky Boba system.
     *
     * Hierarchy:
     *   superadmin      — full system access
     *   branch_manager  — branch-level access
     */
    const PROTECTED_ROLES = ['superadmin', 'branch_manager'];

    /**
     * Handle an incoming request.
     *
     * Usage in routes:
     *   ->middleware('role:superadmin')
     *   ->middleware('role:branch_manager')
     *   ->middleware('role:superadmin,branch_manager')
     *
     * @param  string  ...$roles  Allowed roles for the route
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // 1. Must be authenticated
        if (! $request->user()) {
            return $this->respond($request, 401, 'Unauthenticated. Please log in.');
        }

        $user = $request->user();

        // 2. Account must be ACTIVE
        if (strtoupper($user->status) !== 'ACTIVE') {
            return $this->respond($request, 403, 'Your account is inactive. Contact an administrator.');
        }

        // 3. If no roles specified, block unless user has a protected role
        if (empty($roles)) {
            if (! in_array($user->role, self::PROTECTED_ROLES, true)) {
                return $this->respond($request, 403, 'Access restricted to authorized roles only.');
            }
            return $next($request);
        }

        // 4. Check if the user's role is in the allowed roles for this route
        if (! in_array($user->role, $roles, true)) {
            return $this->respond(
                $request,
                403,
                'Access denied. Required role: ' . implode(' or ', $roles) . '.'
            );
        }

        return $next($request);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function respond(Request $request, int $status, string $message): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status);
        }

        if ($status === 401) {
            return redirect()->route('login')->withErrors(['error' => $message]);
        }

        abort($status, $message);
    }
}