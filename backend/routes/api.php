<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

// This is the one you already have
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// ADD THIS FOR YOUR TEST (api/users)
Route::get('/users', function () {
    return User::all();
});
