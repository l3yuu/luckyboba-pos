<?php

use App\Models\User;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CashTransactionController;

// This route returns the currently logged-in user (requires a Token)
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// This route returns all users (publicly accessible for now)
Route::get('/users', function () {
    return User::all();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/cash-transactions', [CashTransactionController::class, 'store']);
});