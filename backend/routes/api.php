<?php

use App\Http\Controllers\Api\{
    BackupController, CashCountController, CashTransactionController, CategoryController,
    DashboardController, DiscountController, ExpenseController, InventoryController,
    InventoryDashboardController, InventoryReportController, ItemSerialController,
    MenuController, MenuListController, PurchaseOrderController, ReceiptController,
    ReportController, SalesController, SalesDashboardController, SettingsController,
    SubCategoryController, UploadController, VoucherController, BranchController,
    AddOnController, SuperAdminReportController, CardPurchaseController 
};
use App\Http\Controllers\CacheController;
use App\Http\Controllers\Api\CupController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\UserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Role Access Summary
|--------------------------------------------------------------------------
| superadmin      → ALL routes
| branch_manager  → Sales, Transactions, EOD, Catalog, Inventory,
|                   Expenses/Discounts/Vouchers, Reports, Settings, Branches,
|                   Create/Edit/Delete/Toggle CASHIER users only
| cashier         → Sales, Transactions, EOD, Catalog, Menu only
| system_admin    → (extend as needed)
| customer        → Public routes only
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:5,2');
/*
|--------------------------------------------------------------------------
| Mobile App & Public API Routes (No Auth Required)
|--------------------------------------------------------------------------
*/

// --- NEW: CARD PURCHASE ROUTE ---
Route::post('/purchase-card', [CardPurchaseController::class, 'purchase']);
Route::post('/check-card-status/{userId}', [CardPurchaseController::class, 'checkStatus']);

Route::get('/public-menu', function () {
    $items = DB::table('menu_items')
        ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
        ->select(
            'menu_items.id', 'menu_items.name', 'menu_items.barcode',
            'menu_items.quantity', 'categories.name as category',
            'menu_items.price as sellingPrice'
        )->get();
    return response()->json($items);
});

Route::post('/login', function (Request $request) {
    $request->validate(['email' => 'required|email', 'password' => 'required']);
    $user = User::where('email', $request->email)->first();
    if (! $user || ! Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }
    $token = $user->createToken('lucky-boba-token')->plainTextToken;
    return response()->json(['token' => $token, 'user' => $user]);
});

Route::post('/register', function (Request $request) {
    $request->validate([
        'name'     => 'required|string|max:255',
        'email'    => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8',
    ]);
    $user = User::create([
        'name'     => $request->name,
        'email'    => $request->email,
        'password' => Hash::make($request->password),
        'role'     => 'customer',
    ]);
    $token = $user->createToken('lucky-boba-token')->plainTextToken;
    return response()->json(['token' => $token, 'user' => $user], 201);
});

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/user',    fn (Request $request) => $request->user());
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    /*
    |----------------------------------------------------------------------
    | CASHIER + BRANCH MANAGER + SUPERADMIN
    |----------------------------------------------------------------------
    */
    Route::middleware(['role:superadmin,branch_manager,cashier'])->group(function () {

        Route::get('/dashboard/stats', [DashboardController::class, 'index']);
        Route::get('/app-init',        [DashboardController::class, 'init']);
        Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);

        Route::prefix('sales')->group(function () {
            Route::get('/',              [SalesController::class, 'index']);
            Route::post('/',             [SalesController::class, 'store']);
            Route::get('/{id}',          [SalesController::class, 'show']);
            Route::patch('/{id}/cancel', [SalesController::class, 'cancel']);
        });

        Route::prefix('cash-transactions')->group(function () {
            Route::get('/',       [CashTransactionController::class, 'index']);
            Route::post('/',      [CashTransactionController::class, 'store']);
            Route::get('/status', [CashCountController::class, 'checkInitialCash']);
        });

        Route::get('/receipts/search',        [ReceiptController::class, 'search']);
        Route::get('/receipts/next-sequence', [ReceiptController::class, 'getNextSequence']);

        Route::prefix('cash-counts')->group(function () {
            Route::post('/',       [CashCountController::class, 'store']);
            Route::get('/status',  [CashCountController::class, 'checkEodStatus']);
            Route::get('/summary', [ReportController::class, 'getCashCountSummary']);
        });

        Route::get('/menu',              [MenuController::class, 'index']);
        Route::post('/menu/clear-cache', [MenuController::class, 'clearCache']);
        Route::apiResource('menu-list',  MenuListController::class)->only(['index', 'store']);
        Route::get('/add-ons',           [AddOnController::class, 'index']);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('sub-categories', SubCategoryController::class);
        Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);
        Route::get('/cups', [CupController::class, 'index']);

    });

    /*
    |----------------------------------------------------------------------
    | BRANCH MANAGER + SUPERADMIN
    |----------------------------------------------------------------------
    */
    Route::middleware(['role:superadmin,branch_manager'])->group(function () {

        // Inventory & Procurement
        Route::prefix('inventory')->group(function () {
            Route::get('/',                [InventoryController::class, 'index']);
            Route::post('/',               [InventoryController::class, 'store']);
            Route::get('/history',         [InventoryController::class, 'getTransactionHistory']);
            Route::get('/check/{barcode}', [InventoryController::class, 'checkByBarcode']);
            Route::get('/top-products',    [InventoryDashboardController::class, 'getWeeklyTopProducts']);
            Route::patch('/{id}/quantity', [InventoryController::class, 'updateQuantity']);
        });

        Route::prefix('purchase-orders')->group(function () {
            Route::get('/',              [PurchaseOrderController::class, 'index']);
            Route::post('/',             [PurchaseOrderController::class, 'store']);
            Route::patch('/{id}/status', [PurchaseOrderController::class, 'updateStatus']);
        });

        Route::prefix('item-serials')->group(function () {
            Route::get('/',              [ItemSerialController::class, 'index']);
            Route::post('/',             [ItemSerialController::class, 'store']);
            Route::patch('/{id}/status', [ItemSerialController::class, 'updateStatus']);
        });

        // Expenses, Discounts & Vouchers
        Route::apiResource('expenses',  ExpenseController::class)->only(['index', 'store']);
        Route::apiResource('discounts', DiscountController::class)->except(['show', 'update']);
        Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);
        Route::apiResource('vouchers', VoucherController::class)->only(['index', 'store']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/x-reading',          [SalesDashboardController::class, 'xReading']);
            Route::get('/z-reading',          [SalesDashboardController::class, 'zReading']);
            Route::get('/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
            Route::get('/items-report',       [SalesDashboardController::class, 'itemsReport']);
            Route::get('/hourly-sales',       [ReportController::class, 'getHourlySales']);
            Route::get('/void-logs',          [ReportController::class, 'getVoidLogs']);
            Route::get('/item-quantities',    [ReportController::class, 'getItemQuantities']);
            Route::get('/inventory',          [InventoryReportController::class, 'index']);
            Route::get('/sales',              [ReportController::class, 'getSalesReport']);
            Route::get('/food-menu',          [ReportController::class, 'getFoodMenu']);
            Route::get('/export-sales',       [ReportController::class, 'exportSales']);
            Route::get('/export-items',       [ReportController::class, 'exportItems']);
            Route::get('/sales-summary',      [ReportController::class, 'getSalesSummary']);
            Route::get('/sales-detailed',     [ReportController::class, 'getSalesDetailed']);
            Route::get('/dashboard-data',     [SalesDashboardController::class, 'dashboardData']);
        });

        // Settings
        Route::get('/settings',  [SettingsController::class, 'index']);
        Route::post('/settings', [SettingsController::class, 'update']);

        // Users
        Route::prefix('users')->group(function () {
            Route::get('/',                     [UserController::class, 'index']);
            Route::post('/',                    [UserController::class, 'store']);
            Route::get('/stats',                [UserController::class, 'stats']);
            Route::get('/{id}',                 [UserController::class, 'show']);
            Route::put('/{id}',                 [UserController::class, 'update']);
            Route::delete('/{id}',              [UserController::class, 'destroy']);
            Route::patch('/{id}/toggle-status', [UserController::class, 'toggleStatus']);
        });

        // Branches
        Route::prefix('branches')->group(function () {
            Route::get('/performance',        [BranchController::class, 'performance']);
            Route::get('/today-sales',        [BranchController::class, 'todaySales']);
            Route::get('/',                   [BranchController::class, 'index']);
            Route::get('/{id}/daily-sales',   [BranchController::class, 'dailySales']);
            Route::get('/{id}/sales-summary', [BranchController::class, 'salesSummary']);
            Route::get('/{id}/analytics',     [BranchController::class, 'analytics']);
            Route::get('/{id}',               [BranchController::class, 'show']);
        });

        // Cache
        Route::get('/cache/all',             [CacheController::class, 'all']);
        Route::post('/cache/reload/{table}', [CacheController::class, 'reload']);

        // Raw Materials
        Route::get('/raw-materials/low-stock', [RawMaterialController::class, 'lowStock']);
        Route::post('/raw-materials/{rawMaterial}/adjust', [RawMaterialController::class, 'adjust']);
        Route::get('/raw-materials/{rawMaterial}/history', [RawMaterialController::class, 'history']);
        Route::apiResource('raw-materials', RawMaterialController::class);

    });

    /*
    |----------------------------------------------------------------------
    | SUPERADMIN ONLY
    |----------------------------------------------------------------------
    */
    Route::middleware(['role:superadmin'])->group(function () {

        Route::prefix('reports')->group(function () {
            Route::post('/sales-summary',     [SuperAdminReportController::class, 'salesSummary']);
            Route::post('/branch-comparison', [SuperAdminReportController::class, 'branchComparison']);
        });

        Route::prefix('system')->group(function () {
            Route::get('/audit',             [SettingsController::class, 'getAuditLogs']);
            Route::get('/backup-status',     [BackupController::class, 'lastBackupStatus']);
            Route::post('/run-backup',       [BackupController::class, 'runBackup']);
            Route::post('/upload',           [UploadController::class, 'upload']);
            Route::get('/import-history',    [UploadController::class, 'importHistory']);
            Route::post('/upload-discounts', [UploadController::class, 'uploadDiscounts']);
        });

        Route::prefix('branches')->group(function () {
            Route::post('/',                    [BranchController::class, 'store']);
            Route::put('/{id}',                 [BranchController::class, 'update']);
            Route::delete('/{id}',              [BranchController::class, 'destroy']);
            Route::post('/{id}/refresh-totals', [BranchController::class, 'refreshTotals']);
        });

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

    // --- 9. RAW MATERIALS ---
    Route::get('/raw-materials/low-stock',              [RawMaterialController::class, 'lowStock']);
    Route::get('/raw-materials/movements',              [RawMaterialController::class, 'movements']); // 👈 moved up
    Route::post('/raw-materials/{rawMaterial}/adjust',  [RawMaterialController::class, 'adjust']);
    Route::get('/raw-materials/{rawMaterial}/history',  [RawMaterialController::class, 'history']);
    Route::apiResource('raw-materials', RawMaterialController::class); // wildcard last

    // --- 10. RECIPES ---
    // Note: explicit named routes must be defined BEFORE apiResource
    // to avoid the {recipe} wildcard swallowing them.
    Route::get('/recipes/by-menu-item/{menuItemId}', [RecipeController::class, 'byMenuItem']);
    Route::patch('/recipes/{recipe}/toggle', [RecipeController::class, 'toggle']);
    Route::apiResource('recipes', RecipeController::class);

    // --- 11. GENERAL SETTINGS ---
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);
});