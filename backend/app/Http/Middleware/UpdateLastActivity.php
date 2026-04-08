<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            // Update last_activity_at if it's been more than 1 minute since the last update
            // to avoid excessive database writes.
            $user = $request->user();
            if (!$user->last_activity_at || $user->last_activity_at->diffInMinutes(now()) >= 1) {
                $user->forceFill(['last_activity_at' => now()])->save();
            }
        }

        return $next($request);
    }
}
