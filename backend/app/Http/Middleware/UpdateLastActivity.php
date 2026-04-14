<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            if ($request->user()) {
                $user = $request->user();
                if (!$user->last_activity_at || $user->last_activity_at->diffInMinutes(now()) >= 1) {
                    $user->forceFill(['last_activity_at' => now()])->save();
                }
            }
        } catch (\Exception $e) {
            // silently fail
        }

        return $next($request);
    }
}