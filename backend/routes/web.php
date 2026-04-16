<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

Route::get('/login', function () {
    return response()->json([
        'message' => 'Use POST /api/login for app authentication.',
    ], 401);
});

require __DIR__.'/auth.php';
