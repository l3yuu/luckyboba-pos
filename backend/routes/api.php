<?php

use App\Models\User;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\CashCountController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Public Login (This becomes /api/login)
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

Route::get('/users', function () {
    return User::all();
});

/*
|--------------------------------------------------------------------------
| Protected API Routes (Requires Authentication)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Auth User Info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Logout (This becomes /api/logout)
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);

    // Cash Transactions
    Route::get('/cash-transactions', [CashTransactionController::class, 'index']);
    Route::post('/cash-transactions', [CashTransactionController::class, 'store']);

    // Receipts
    Route::get('/receipts/search', [ReceiptController::class, 'search']);

    // Cash Counts (EOD)
    Route::post('/cash-counts', [CashCountController::class, 'store']);
});