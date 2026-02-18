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
use App\Http\Controllers\Api\ItemsReportController;
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
use App\Http\Controllers\Auth\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

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

    // --- USER MANAGEMENT ---
    Route::get('/users/stats', [UserController::class, 'stats']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

    // --- ANALYTICS & REPORTING ---
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);
    Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);
    Route::get('/dashboard/data', [SalesDashboardController::class, 'dashboardData']);

    // --- MENU MANAGEMENT ---
    Route::get('/menu', [MenuController::class, 'index']);
    Route::post('/menu/clear-cache', [MenuController::class, 'clearCache']);

    // --- SALES / ORDERS (POS Transactions) ---
    Route::post('/sales', [SalesController::class, 'store']);
    Route::get('/sales', [SalesController::class, 'index']);
    Route::get('/sales/{id}', [SalesController::class, 'show']);
    Route::patch('/sales/{id}/cancel', [SalesController::class, 'cancel']);
    Route::post('/sales/{id}/cancel', [SalesController::class, 'cancel']);

    // --- CASH & RECEIPTS ---
    Route::get('/cash-transactions', [CashTransactionController::class, 'index']);
    Route::post('/cash-transactions', [CashTransactionController::class, 'store']);
    Route::get('/receipts/search', [ReceiptController::class, 'search']);
    Route::get('/cash-transactions/status', [CashCountController::class, 'checkInitialCash']);

    // --- END OF DAY ---
    Route::post('/cash-counts', [CashCountController::class, 'store']);
    Route::get('/cash-counts/status', [CashCountController::class, 'checkEodStatus']);

    // --- SALES REPORTS ---
    Route::get('/items-report', [SalesDashboardController::class, 'itemsReport']);
    Route::get('/items-reports/items', [ItemsReportController::class, 'getItemsSoldReport']);
    Route::get('/reports/x-reading', [SalesDashboardController::class, 'xReading']);
    Route::get('/reports/z-reading', [SalesDashboardController::class, 'zReading']);
    Route::get('/reports/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
    Route::get('/reports/sales', [ReportController::class, 'getSalesReport']);
    Route::get('/reports/food-menu', [ReportController::class, 'getFoodMenuReport']);

    // --- MENU LIST ---
    Route::get('/menu-list', [MenuListController::class, 'index']);

    // --- CATEGORIES ---
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::patch('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- SUB-CATEGORIES ---
    Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);
    Route::apiResource('sub-categories', SubCategoryController::class);

    // --- INVENTORY ---
    Route::get('/inventory/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
    Route::get('/inventory/check/{barcode}', [InventoryController::class, 'checkByBarcode']);
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::patch('/inventory/{id}/quantity', [InventoryController::class, 'updateQuantity']);
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);

    // --- SETTINGS ---
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);

    // --- VOUCHERS ---
    Route::get('/vouchers', [VoucherController::class, 'index']);
    Route::post('/vouchers', [VoucherController::class, 'store']);

    // --- OTHER REPORTS ---
    Route::get('/reports/inventory', [InventoryReportController::class, 'index']);

    // --- ITEM SERIALS ---
    Route::get('/item-serials', [ItemSerialController::class, 'index']);
    Route::post('/item-serials', [ItemSerialController::class, 'store']);

    // --- EXPENSES ---
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);

    // --- AUDIT ---
    Route::get('/system/audit', [SettingsController::class, 'getAuditLogs']);
});