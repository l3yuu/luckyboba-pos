<?php

use App\Http\Controllers\Api\CashCountController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InventoryDashboardController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\MenuListController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\SalesDashboardController;
use App\Http\Controllers\Api\ItemsReportController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\UserController;
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
    
    // --- USER & SYSTEM INIT ---
    Route::get('/app-init', [DashboardController::class, 'init']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // --- ANALYTICS & REPORTING ---
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);
    Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);

    // --- MENU MANAGEMENT ---
    Route::get('/menu', [MenuController::class, 'index']);
    Route::post('/menu/clear-cache', [MenuController::class, 'clearCache']); 

    // --- SALES / ORDERS (POS Transactions) ---
    Route::post('/sales', [SalesController::class, 'store']);     
    Route::get('/sales', [SalesController::class, 'index']);       
    Route::get('/sales/{id}', [SalesController::class, 'show']);   
    Route::patch('/sales/{id}/cancel', [SalesController::class, 'cancel']);

    // --- CASH & RECEIPTS ---
    Route::get('/cash-transactions', [CashTransactionController::class, 'index']);
    Route::post('/cash-transactions', [CashTransactionController::class, 'store']);
    Route::get('/receipts/search', [ReceiptController::class, 'search']);
    Route::get('/cash-transactions/status', [CashTransactionController::class, 'checkInitialCash']);

    // --- END OF DAY ---
    Route::post('/cash-counts', [CashCountController::class, 'store']);
<<<<<<< HEAD
    
    // --- ITEMS REPORT ---
    Route::prefix('items-reports')->group(function () {
        Route::get('/test', [ItemsReportController::class, 'test']);
        Route::post('/items', [ItemsReportController::class, 'getItemsSoldReport']);
        Route::get('/items/today', [ItemsReportController::class, 'getItemsSoldToday']);
    });

    // --- USER MANAGEMENT ---
    Route::get('/users/stats', [UserController::class, 'stats']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::apiResource('users', UserController::class);
=======
    Route::get('/cash-counts/status', [CashCountController::class, 'checkEodStatus']);
>>>>>>> 8037a50714c3d3934f9c9d526420fec48518efa1

    // --- SALES REPORTS ---
    Route::get('/items-report', [SalesDashboardController::class, 'itemsReport']);
    Route::get('/reports/x-reading', [SalesDashboardController::class, 'xReading']);
    Route::get('/reports/z-reading', [SalesDashboardController::class, 'zReading']);
    Route::get('/reports/mall-accreditation', [SalesDashboardController::class, 'mallReport']);

    // --- MENU LIST ---
    Route::get('/menu-list', [MenuListController::class, 'index']);

    // --- CATEGORIES ---
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::patch('/categories/{id}', [CategoryController::class, 'update']);

    // --- INVENTORY DASHBOARD ---
    Route::get('/inventory/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::patch('/inventory/{id}/quantity', [InventoryController::class, 'updateQuantity']);
    Route::get('/inventory/check/{barcode}', [InventoryController::class, 'checkByBarcode']);
});

/*
|--------------------------------------------------------------------------
| Branch Routes (Outside Auth Middleware)
|--------------------------------------------------------------------------
*/
Route::prefix('branches')->group(function () {
    // Main CRUD operations
    Route::get('/', [BranchController::class, 'index']);
    Route::post('/', [BranchController::class, 'store']);
    Route::get('/{id}', [BranchController::class, 'show']);
    Route::put('/{id}', [BranchController::class, 'update']);
    Route::delete('/{id}', [BranchController::class, 'destroy']);
    
    // Analytics & Reports
    Route::get('/analytics/performance', [BranchController::class, 'performance']);
    Route::get('/analytics/today', [BranchController::class, 'todaySales']);
    Route::get('/{id}/daily-sales', [BranchController::class, 'dailySales']);
    Route::get('/{id}/summary', [BranchController::class, 'salesSummary']);
    
    // Utility
    Route::post('/{id}/refresh', [BranchController::class, 'refreshTotals']);
});