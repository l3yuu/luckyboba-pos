<?php

use App\Http\Controllers\Api\CashCountController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InventoryDashboardController;
use App\Http\Controllers\Api\InventoryReportController;
use App\Http\Controllers\Api\ItemSerialController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\MenuListController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\SalesDashboardController; 
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
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
    Route::get('/cash-counts/status', [CashCountController::class, 'checkEodStatus']);

    // --- SALES REPORTS ---
    Route::get('/items-report', [SalesDashboardController::class, 'itemsReport']);
    Route::get('/reports/x-reading', [SalesDashboardController::class, 'xReading']);
    Route::get('/reports/z-reading', [SalesDashboardController::class, 'zReading']);
    Route::get('/reports/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
    Route::get('/reports/sales', [ReportController::class, 'getSalesReport']);
    Route::get('/reports/food-menu', [ReportController::class, 'getFoodMenuReport']);

    // --- MENU LIST ---
    Route::get('/menu-list', [MenuListController::class, 'index']);

    // --- CATEGORIES (Cleaned up) ---
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::patch('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- SUB-CATEGORIES ---
    // Added specific filter route for the dynamic dropdowns
    Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);
    Route::apiResource('sub-categories', SubCategoryController::class);

    // --- INVENTORY DASHBOARD ---
    Route::get('/inventory/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::patch('/inventory/{id}/quantity', [InventoryController::class, 'updateQuantity']);
    Route::get('/inventory/check/{barcode}', [InventoryController::class, 'checkByBarcode']);
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    // REMOVED duplicate Route::get('/categories') and Route::patch('/categories/{id}') from here

    // --- SETTINGS ---
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);

    // --- VOUCHERS ---
    Route::get('/vouchers', [VoucherController::class, 'index']);
    Route::post('/vouchers', [VoucherController::class, 'store']);

    Route::get('/reports/inventory', [InventoryReportController::class, 'index']);

    Route::get('/item-serials', [ItemSerialController::class, 'index']);
    Route::post('/item-serials', [ItemSerialController::class, 'store']);

    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);

    Route::get('/system/audit', [SettingsController::class, 'getAuditLogs']);
});