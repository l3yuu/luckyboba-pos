<?php

use App\Http\Controllers\Api\{
    BackupController, CashCountController, CashTransactionController, CategoryController,
    DashboardController, DiscountController, ExpenseController, InventoryController,
    InventoryDashboardController, InventoryReportController, ItemSerialController,
    MenuController, MenuListController, PurchaseOrderController, ReceiptController,
    ReportController, SalesController, SalesDashboardController, SettingsController,
    SubCategoryController, UploadController, VoucherController
};
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Models\User;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:5,2');
Route::get('/users', function () { return User::all(); });

/*
|--------------------------------------------------------------------------
| Protected API Routes (Requires auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    
    // --- 1. SYSTEM CORE & DASHBOARD ---
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/app-init', [DashboardController::class, 'init']);
    Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);

    // --- 2. SALES & TRANSACTIONS (POS) ---
    Route::prefix('sales')->group(function () {
        Route::get('/', [SalesController::class, 'index']);
        Route::post('/', [SalesController::class, 'store']);
        Route::get('/{id}', [SalesController::class, 'show']);
        Route::patch('/{id}/cancel', [SalesController::class, 'cancel']);
    });
    
    Route::prefix('cash-transactions')->group(function () {
        Route::get('/', [CashTransactionController::class, 'index']);
        Route::post('/', [CashTransactionController::class, 'store']);
        Route::get('/status', [CashCountController::class, 'checkInitialCash']);
    });

    Route::get('/receipts/search', [ReceiptController::class, 'search']);

    // --- 3. END OF DAY (EOD) OPERATIONS ---
    Route::prefix('cash-counts')->group(function () {
        Route::post('/', [CashCountController::class, 'store']);
        Route::get('/status', [CashCountController::class, 'checkEodStatus']);
        Route::get('/summary', [ReportController::class, 'getCashCountSummary']);
    });

    // --- 4. CATALOG & MENU MANAGEMENT ---
    Route::get('/menu', [MenuController::class, 'index']);
    Route::post('/menu/clear-cache', [MenuController::class, 'clearCache']);
    Route::apiResource('menu-list', MenuListController::class)->only(['index', 'store']);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('sub-categories', SubCategoryController::class);
    Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);

    // --- 5. INVENTORY & PROCUREMENT ---
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

    // --- 6. EXPENSES & DISCOUNTS ---
    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store']);
    Route::apiResource('discounts', DiscountController::class)->except(['show', 'update']);
    Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);
    Route::apiResource('vouchers', VoucherController::class)->only(['index', 'store']);

    // --- 7. ANALYTICS & EXPORT REPORTS ---
    Route::prefix('reports')->group(function () {
        // Business Intelligence
        Route::get('/x-reading', [SalesDashboardController::class, 'xReading']);
        Route::get('/z-reading', [SalesDashboardController::class, 'zReading']);
        Route::get('/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
        Route::get('/items-report', [SalesDashboardController::class, 'itemsReport']); // Moved inside for better organization
        Route::get('/hourly-sales', [ReportController::class, 'getHourlySales']); 
        Route::get('/void-logs', [ReportController::class, 'getVoidLogs']);
        Route::get('/item-quantities', [ReportController::class, 'getItemQuantities']);
        Route::get('/inventory', [InventoryReportController::class, 'index']);

        // Excel/CSV Exports
        Route::get('/sales', [ReportController::class, 'getSalesReport']); 
        Route::get('/food-menu', [ReportController::class, 'getFoodMenu']); 
        Route::get('/export-sales', [ReportController::class, 'exportSales']);
        Route::get('/export-items', [ReportController::class, 'exportItems']);
        Route::get('/sales-summary',  [ReportController::class, 'getSalesSummary']);
        Route::get('/sales-detailed', [ReportController::class, 'getSalesDetailed']);
    });

    // --- 8. SETTINGS & MAINTENANCE ---
    Route::prefix('system')->group(function () {
        Route::get('/audit', [SettingsController::class, 'getAuditLogs']);
        Route::get('/backup-status', [BackupController::class, 'lastBackupStatus']);
        Route::post('/run-backup', [BackupController::class, 'runBackup']);
        Route::post('/upload', [UploadController::class, 'upload']);
        Route::get('/import-history', [UploadController::class, 'importHistory']);
        Route::post('/upload-discounts', [UploadController::class, 'uploadDiscounts']);
    });

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);
});