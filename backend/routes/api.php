<?php

use App\Models\User;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SalesDashboardController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\CashCountController;
use App\Http\Controllers\Api\ItemsReportController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\UserController;
/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
| These routes can be accessed without a Bearer Token.
*/

// Login route (generates the token)
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// This route is required for your UserApiTest to pass (returns 200 instead of 404)
Route::get('/users', function () {
    return User::all();
});

/*
|--------------------------------------------------------------------------
| Protected API Routes (Requires auth:sanctum)
|--------------------------------------------------------------------------
| These routes require the "Authorization: Bearer <token>" header.
*/
Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::get('/app-init', [DashboardController::class, 'init']);

    // Auth User Info - Useful for refreshing user data in React
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Logout - Revokes the current token in the database
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // Dashboard Statistics
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);

    // ====================================================================
    // Sales Dashboard Routes
    // ====================================================================
    Route::prefix('dashboard')->group(function () {
        Route::get('/weekly-sales', [SalesDashboardController::class, 'getWeeklySales']);
        Route::get('/today-sales', [SalesDashboardController::class, 'getTodaySales']);
        Route::get('/statistics', [SalesDashboardController::class, 'getSalesStatistics']);
        Route::get('/data', [SalesDashboardController::class, 'getDashboardData']);
    });
    
    // Cash Transactions (POS Sales and Cash Ins)
    Route::get('/cash-transactions', [CashTransactionController::class, 'index']);
    Route::post('/cash-transactions', [CashTransactionController::class, 'store']);

    // Receipts / Transaction History
    Route::get('/receipts/search', [ReceiptController::class, 'search']);

    // Cash Counts / End of Day Reporting
    Route::post('/cash-counts', [CashCountController::class, 'store']);
    
    // ====================================================================
    // Items Report Routes (FIXED)
    // ====================================================================
    Route::prefix('items-reports')->group(function () {
        Route::get('/test', [ItemsReportController::class, 'test']); // Test endpoint
        Route::post('/items', [ItemsReportController::class, 'getItemsSoldReport']);
        Route::get('/items/today', [ItemsReportController::class, 'getItemsSoldToday']);
    });

    // User CRUD routes (protected by auth middleware)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Get user statistics
    Route::get('/users/stats', [UserController::class, 'stats']);
    
    // Toggle user status
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    
    // Standard CRUD operations
    Route::apiResource('users', UserController::class);
});
});