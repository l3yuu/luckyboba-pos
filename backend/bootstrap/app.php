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
        $middleware->statefulApi();

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'login',
            'logout'
        ]);

        $middleware->append(\App\Http\Middleware\ContentSecurityPolicy::class);

        // Role-based access control + active status guard
        $middleware->alias([
            'role'   => \App\Http\Middleware\CheckRole::class,
            'active' => \App\Http\Middleware\CheckUserActive::class, // ✅ blocks INACTIVE users on every protected request
        ]);
    })
    // FIX: withSchedule() was duplicated — Laravel was registering the prune
    // command twice, causing it to run twice every day.
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('sanctum:prune-expired --hours=8')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();