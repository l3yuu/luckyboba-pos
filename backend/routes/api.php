<?php

use App\Models\User;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\CashCountController; // Added the new controller

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

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/
Route::get('/users', function () {
    return User::all();
});