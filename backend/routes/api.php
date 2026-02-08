<?php

use App\Models\User;
use Illuminate\Http\Request; // THIS WAS MISSING
use Illuminate\Support\Facades\Route;

// This route returns the currently logged-in user (requires a Token)
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// This route returns all users (publicly accessible for now)
Route::get('/users', function () {
    return User::all();
});