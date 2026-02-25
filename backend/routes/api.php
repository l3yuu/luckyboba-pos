<?php

use App\Http\Controllers\Api\CashCountController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\SalesController;
use App\Models\User;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::get('/users', function () { return User::all(); });

/*
|--------------------------------------------------------------------------
| Protected API Routes (Requires auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    
    // --- USER & INIT ---
    Route::get('/app-init', [DashboardController::class, 'init']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // --- MENU ---
    Route::get('/menu', [MenuController::class, 'index']);
    Route::post('/menu/clear-cache', [MenuController::class, 'clearCache']); // Optional

    // --- DASHBOARD ---
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);

    // --- SALES / ORDERS ---
    Route::post('/sales', [SalesController::class, 'store']);      // Create new sale (from POS)
    Route::get('/sales', [SalesController::class, 'index']);       // List all sales
    Route::get('/sales/{id}', [SalesController::class, 'show']);   // View single sale

    // --- CASH TRANSACTIONS ---
    Route::get('/cash-transactions', [CashTransactionController::class, 'index']);
    Route::post('/cash-transactions', [CashTransactionController::class, 'store']);

    // --- RECEIPTS / TRANSACTION HISTORY ---
    Route::get('/receipts/search', [ReceiptController::class, 'search']);

    // --- CASH COUNTS / END OF DAY ---
    Route::post('/cash-counts', [CashCountController::class, 'store']);
});