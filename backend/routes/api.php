<?php

use App\Http\Controllers\Api\{ BackupController, BranchSettingsController, CashCountController, CashTransactionController, CategoryController, DashboardController, DiscountController, ExpenseController, InventoryController, StockTransferController, InventoryDashboardController, InventoryReportController, ItemSerialController, MenuController, MenuListController, PurchaseOrderController, ReceiptController, RecipeController, ReportController, SalesController, SalesDashboardController, SearchController, SettingsController, SubCategoryController, UploadController, VoucherController, BranchController, AddOnController, SuperAdminReportController, CardPurchaseController, MenuItemController, SupplierController, ItemCheckerController, PulseController, StaffPerformanceController, InventoryAlertController };
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchManagerAppController; // ✅ FIXED: now in Api namespace
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Admin/Superadmin shared routes
    Route::prefix('admin')->group(function () {
        Route::get ('/branches', [BranchController::class, 'index']);
        
        // Settings with branch_id
        Route::get ('/settings',               [SettingsController::class, 'getBranchSettings']);
        Route::post('/settings/update-branch', [SettingsController::class, 'updateBranchSettings']);
        
        // Audit Logs
        Route::get   ('/audit-logs',        [AuditLogController::class, 'index']);
        Route::get   ('/audit-logs/export', [AuditLogController::class, 'export']);
        
        // Dashboard Stats
        Route::get('/dashboard/stats',   [DashboardController::class, 'getStats']);
        Route::get('/dashboard/revenue', [DashboardController::class, 'getRevenueChart']);
        Route::get('/dashboard/share',   [DashboardController::class, 'getShareChart']);
        
        // Menu Management (Delegated to specialized controllers)
        Route::get ('/categories',          [CategoryController::class,    'index']);
        Route::post('/categories',          [CategoryController::class,    'store']);
        Route::put ('/categories/{id}',     [CategoryController::class,    'update']);
        Route::delete('/categories/{id}',   [CategoryController::class,    'destroy']);

        Route::get ('/sub-categories',      [SubCategoryController::class, 'index']);
        Route::post('/sub-categories',      [SubCategoryController::class, 'store']);
        Route::put ('/sub-categories/{id}', [SubCategoryController::class, 'update']);
        Route::delete('/sub-categories/{id}', [SubCategoryController::class, 'destroy']);

        Route::get ('/menu-items',          [MenuItemController::class,    'index']);
        Route::post('/menu-items',          [MenuItemController::class,    'store']);
        Route::put ('/menu-items/{id}',     [MenuItemController::class,    'update']);
        Route::delete('/menu-items/{id}',   [MenuItemController::class,    'destroy']);
        
        Route::get('/item-serials',    [ItemSerialController::class,    'index']);

        Route::get ('/recipes',  [RecipeController::class, 'index']);

        // Expenses Management
        Route::get('/expenses/export', [ExpenseController::class, 'export']);
        Route::apiResource('expenses', ExpenseController::class);

        Route::prefix('discounts')->group(function () {
            Route::get   ('/',                    [DiscountController::class, 'index']);
            Route::post  ('/',                    [DiscountController::class, 'store']);
            Route::put   ('/{discount}',          [DiscountController::class, 'update']);
            Route::delete('/{discount}',          [DiscountController::class, 'destroy']);
            Route::patch ('/{discount}/toggle',   [DiscountController::class, 'toggleStatus']);
        });

        Route::prefix('add-ons')->group(function () {
            Route::get   ('/',               [AddOnController::class, 'index']);
            Route::post  ('/',               [AddOnController::class, 'store']);
            Route::put   ('/{addOn}',        [AddOnController::class, 'update']);
            Route::delete('/{addOn}',        [AddOnController::class, 'destroy']);
            Route::patch ('/{id}/toggle',    [AddOnController::class, 'toggleStatus']);
        });

        Route::prefix('vouchers')->group(function () {
            Route::get   ('/',                [VoucherController::class, 'index']);
            Route::post  ('/',                [VoucherController::class, 'store']);
            Route::put   ('/{voucher}',       [VoucherController::class, 'update']);
            Route::delete('/{voucher}',       [VoucherController::class, 'destroy']);
            Route::patch ('/{id}/toggle',     [VoucherController::class, 'toggleStatus']);
        });

        // Inventory Management
        Route::prefix('inventory')->group(function () {
            Route::get ('/dashboard/stats',   [InventoryDashboardController::class, 'getStats']);
            Route::get ('/dashboard/alerts',  [InventoryAlertController::class, 'getAlerts']);
            
            Route::get ('/items',             [InventoryController::class, 'index']);
            Route::post('/items',             [InventoryController::class, 'store']);
            Route::put ('/items/{id}',        [InventoryController::class, 'update']);
            Route::delete('/items/{id}',      [InventoryController::class, 'destroy']);
            
            Route::prefix('suppliers')->group(function () {
                Route::get   ('/',            [SupplierController::class, 'index']);
                Route::post  ('/',            [SupplierController::class, 'store']);
                Route::put   ('/{id}',        [SupplierController::class, 'update']);
                Route::delete('/{id}',        [SupplierController::class, 'destroy']);
            });

            Route::get ('/checkers',          [ItemCheckerController::class, 'index']);
            Route::post('/checkers',          [ItemCheckerController::class, 'store']);

            Route::get ('/usage-report',      [InventoryController::class, 'usageReport']);
            Route::get ('/export-usage',      [InventoryController::class, 'exportUsageReport']);
        });

        // Reports Management
        Route::prefix('reports')->group(function () {
            Route::get('/sales',              [SuperAdminReportController::class, 'getSalesReport']);
            Route::get('/sales/export',       [SuperAdminReportController::class, 'exportSales']);
            
            Route::get('/items',              [SuperAdminReportController::class, 'getItemsReport']);
            Route::get('/items/export',       [SuperAdminReportController::class, 'exportItems']);

            Route::get('/performance',        [StaffPerformanceController::class, 'getReport']);
            
            Route::get('/backups',            [BackupController::class, 'index']);
            Route::post('/backups',           [BackupController::class, 'create']);
            Route::delete('/backups/{id}',    [BackupController::class, 'destroy']);
            Route::get('/backups/download/{id}', [BackupController::class, 'download']);
        });
    });

    // Cashier/Branch specific routes
    Route::get('/sales',                [SalesController::class, 'index']);
    Route::post('/sales',               [SalesController::class, 'store']);
    Route::get('/sales/search',         [SalesController::class, 'search']);
    Route::get('/sales/stats',          [SalesDashboardController::class, 'getStats']);
    Route::get('/sales/export',         [ReportController::class, 'exportSales']);
    Route::get('/sales/{id}',           [SalesController::class, 'show']);
    Route::patch('/sales/{id}/status',  [SalesController::class, 'updateStatus']);

    Route::get ('/menu-list', [MenuListController::class, 'index']);
    Route::get ('/categories-list', [CategoryController::class, 'index']);
    
    Route::prefix('cash-counts')->group(function () {
        Route::get   ('/', [CashCountController::class, 'index']);
        Route::post  ('/', [CashCountController::class, 'store']);
    });

    Route::prefix('cash-transactions')->group(function () {
        Route::get   ('/', [CashTransactionController::class, 'index']);
        Route::post  ('/', [CashTransactionController::class, 'store']);
    });

    Route::prefix('item-serials')->group(function () {
        Route::get   ('/',                [ItemSerialController::class, 'index']);
        Route::patch ('/{id}/status',     [ItemSerialController::class, 'updateStatus']);
    });

    Route::apiResource('discounts', DiscountController::class)->except(['show', 'update', 'index']);
    Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);

    Route::post('/upload', [UploadController::class, 'upload']);
    Route::get('/search',  [SearchController::class, 'search']);
    
    // For manual item price retrieval in cashier (if needed)
    Route::get('/menu-items/search', [MenuItemController::class, 'search']);

    // POS Device Monitoring
    Route::prefix('pulse')->group(function () {
        Route::post('/heartbeat', [PulseController::class, 'heartbeat']);
        Route::get ('/history',   [PulseController::class, 'history']);
    });
});

// Branch Settings (External access if needed)
Route::prefix('branch-settings')->group(function () {
    Route::get ('/{branchId}', [BranchSettingsController::class, 'show']);
    Route::post('/{branchId}', [BranchSettingsController::class, 'update']);
});

// Branch Manager App Specific Routes
Route::prefix('bm-app')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard',          [BranchManagerAppController::class, 'getDashboard']);
    Route::get('/menu-items',         [BranchManagerAppController::class, 'getMenuItems']);
    Route::patch('/menu-items/toggle', [BranchManagerAppController::class, 'toggleAvailability']);
    Route::get('/inventory',          [BranchManagerAppController::class, 'getInventory']);
});