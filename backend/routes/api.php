<?php

use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CashCountController;
use App\Http\Controllers\Api\CashTransactionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiscountController;
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
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\Api\BranchController;

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

    // --- 1. SYSTEM CORE & DASHBOARD ---
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/app-init', [DashboardController::class, 'init']);
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);
    Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);
    Route::get('/dashboard/data', [SalesDashboardController::class, 'dashboardData']);

    // --- 2. USER MANAGEMENT ---
    Route::get('/users/stats', [UserController::class, 'stats']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

    // --- 3. BRANCH MANAGEMENT ---
    Route::apiResource('branches', BranchController::class);

    // --- 4. SALES & TRANSACTIONS (POS) ---
    Route::prefix('sales')->group(function () {
        Route::get('/', [SalesController::class, 'index']);
        Route::post('/', [SalesController::class, 'store']);
        Route::get('/{id}', [SalesController::class, 'show']);
        Route::patch('/{id}/cancel', [SalesController::class, 'cancel']);
        Route::post('/{id}/cancel', [SalesController::class, 'cancel']);
    });

    Route::get('/receipts/search', [ReceiptController::class, 'search']);

    // --- 5. CASH & EOD OPERATIONS ---
    Route::prefix('cash-transactions')->group(function () {
        Route::get('/', [CashTransactionController::class, 'index']);
        Route::post('/', [CashTransactionController::class, 'store']);
        Route::get('/status', [CashCountController::class, 'checkInitialCash']);
    });

    Route::prefix('cash-counts')->group(function () {
        Route::post('/', [CashCountController::class, 'store']);
        Route::get('/status', [CashCountController::class, 'checkEodStatus']);
        Route::get('/summary', [ReportController::class, 'getCashCountSummary']);
    });

    // --- 6. CATALOG & MENU MANAGEMENT ---
    Route::get('/menu', [MenuController::class, 'index']);
    Route::post('/menu/clear-cache', [MenuController::class, 'clearCache']);
    Route::apiResource('menu-list', MenuListController::class)->only(['index', 'store']);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('sub-categories', SubCategoryController::class);
    Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);

    // --- 7. INVENTORY & PROCUREMENT ---
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::post('/', [InventoryController::class, 'store']);
        Route::get('/history', [InventoryController::class, 'getTransactionHistory']);
        Route::get('/check/{barcode}', [InventoryController::class, 'checkByBarcode']);
        Route::get('/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
        Route::patch('/{id}/quantity', [InventoryController::class, 'updateQuantity']);
    });

    Route::prefix('purchase-orders')->group(function () {
        Route::get('/', [PurchaseOrderController::class, 'index']);
        Route::post('/', [PurchaseOrderController::class, 'store']);
        Route::patch('/{id}/status', [PurchaseOrderController::class, 'updateStatus']);
    });

    Route::prefix('item-serials')->group(function () {
        Route::get('/', [ItemSerialController::class, 'index']);
        Route::post('/', [ItemSerialController::class, 'store']);
        Route::patch('/{id}/status', [ItemSerialController::class, 'updateStatus']);
    });

    // --- 8. EXPENSES, DISCOUNTS & VOUCHERS ---
    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store']);
    Route::apiResource('vouchers', VoucherController::class)->only(['index', 'store']);
    Route::apiResource('discounts', DiscountController::class)->except(['show', 'update']);
    Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);

    // --- 9. ANALYTICS & EXPORT REPORTS ---
    Route::prefix('reports')->group(function () {
        Route::get('/x-reading', [SalesDashboardController::class, 'xReading']);
        Route::get('/z-reading', [SalesDashboardController::class, 'zReading']);
        Route::get('/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
        Route::get('/items-report', [SalesDashboardController::class, 'itemsReport']);
        Route::get('/hourly-sales', [ReportController::class, 'getHourlySales']);
        Route::get('/void-logs', [ReportController::class, 'getVoidLogs']);
        Route::get('/item-quantities', [ReportController::class, 'getItemQuantities']);
        Route::get('/inventory', [InventoryReportController::class, 'index']);
        Route::get('/sales', [ReportController::class, 'getSalesReport']);
        Route::get('/food-menu', [ReportController::class, 'getFoodMenu']);
        Route::get('/export-sales', [ReportController::class, 'exportSales']);
        Route::get('/export-items', [ReportController::class, 'exportItems']);
        Route::get('/cash-count-summary', [ReportController::class, 'getCashCountSummary']);
        Route::get('/sales-summary', [ReportController::class, 'getSalesSummary']);
        Route::get('/sales-detailed', [ReportController::class, 'getSalesDetailed']);
    });

    Route::get('/items-reports/items', [ItemsReportController::class, 'getItemsSoldReport']);

    // --- 10. SETTINGS & MAINTENANCE ---
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);

    Route::prefix('system')->group(function () {
        Route::get('/audit', [SettingsController::class, 'getAuditLogs']);
        Route::get('/backup-status', [BackupController::class, 'lastBackupStatus']);
        Route::post('/run-backup', [BackupController::class, 'runBackup']);
        Route::post('/upload', [UploadController::class, 'upload']);
        Route::get('/import-history', [UploadController::class, 'importHistory']);
        Route::post('/upload-discounts', [UploadController::class, 'uploadDiscounts']);
    });
});