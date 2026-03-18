<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // No authenticated user — let auth:sanctum handle it
        if (! $user) {
            return $next($request);
        }

        if ($user->status === 'INACTIVE') {
            // Revoke all tokens so the client can't retry with the same token
            $user->tokens()->delete();

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        return $next($request);
    }
}