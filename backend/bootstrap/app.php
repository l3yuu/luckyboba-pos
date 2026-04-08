<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ❌ REMOVED: $middleware->statefulApi();
        // This was adding EnsureFrontendRequestsAreStateful to all API routes,
        // which broke Bearer token auth for the mobile app.

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'login',
            'logout'
        ]);

        $middleware->append(\App\Http\Middleware\ContentSecurityPolicy::class);
        $middleware->append(\App\Http\Middleware\UpdateLastActivity::class);

        $middleware->alias([
            'role'   => \App\Http\Middleware\CheckRole::class,
            'active' => \App\Http\Middleware\CheckUserActive::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('sanctum:prune-expired --hours=8')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();