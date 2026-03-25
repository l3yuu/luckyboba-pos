<?php

use App\Http\Controllers\Api\{ BackupController, CashCountController, CashTransactionController, CategoryController, DashboardController, DiscountController, ExpenseController, InventoryController, StockTransferController, InventoryDashboardController, InventoryReportController, ItemSerialController, MenuController, MenuListController, PurchaseOrderController, ReceiptController, ReportController, SalesController, SalesDashboardController, SettingsController, SubCategoryController, UploadController, VoucherController, BranchController, AddOnController, SuperAdminReportController, CardPurchaseController, MenuItemController, SupplierController, ItemCheckerController };
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BundleController;
use App\Http\Controllers\Api\CupController;
use App\Http\Controllers\Api\ItemsReportController;
use App\Http\Controllers\Api\MenuItemOptionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PosDeviceController;   // ← NEW
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\CacheController;
use App\Http\Controllers\CategoryDrinkController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

Route::post('/login',  [AuthController::class, 'login'])->middleware('throttle:5,2');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ── DEVICE CHECK — public, no auth, called before login ──────────────────────
Route::post('/devices/check', [PosDeviceController::class, 'check']);
// ─────────────────────────────────────────────────────────────────────────────

Route::post('/purchase-card',             [CardPurchaseController::class, 'purchase']);
Route::get('/check-card-status/{userId}', [CardPurchaseController::class, 'checkStatus']);

// ── PUBLIC MENU ───────────────────────────────────────────────────────────────
// Returns all menu items with full image URL for the Flutter customer app.
// Uses Laravel's url() helper so it works correctly in both local and production.
// Local:      http://10.0.2.2:8000/storage/menu/foods/photo.png
// Production: https://luckybobastores.com/storage/menu/foods/photo.png
Route::get('/public-menu', function () {
    $items = DB::table('menu_items')
        ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
        ->select(
            'menu_items.id',
            'menu_items.name',
            'menu_items.barcode',
            'menu_items.quantity',
            'categories.name as category',
            'menu_items.price as sellingPrice',
            'menu_items.image'
        )
        ->get()
        ->filter(function ($item) {
            // Skip items with null/empty category to prevent JSON corruption
            return !is_null($item->category) && $item->category !== '';
        })
        ->values()
        ->map(function ($item) {
            // url() automatically uses APP_URL from .env
            $item->image = $item->image
                ? url('storage/' . $item->image)
                : null;
            return $item;
        });

    return response()->json($items);
});
// ─────────────────────────────────────────────────────────────────────────────
Route::post('/google-login', [AuthController::class, 'googleLogin']);
Route::post('/register', function (Request $request) {
    $request->validate([
        'name'     => 'required|string|max:255',
        'email'    => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8',
    ]);
    $user  = User::create([
        'name'     => $request->name,
        'email'    => $request->email,
        'password' => Hash::make($request->password),
        'role'     => 'customer',
    ]);
    $token = $user->createToken('auth-token')->plainTextToken;
    return response()->json(['token' => $token, 'user' => $user], 201);
});

// ── Authenticated routes ─────────────────────────────────────────────────────
// FIX: Added 'active' middleware so any account set to INACTIVE in the DB is
// immediately blocked on every request — tokens are revoked on the spot.

Route::middleware(['auth:sanctum', 'active'])->group(function () {

    Route::get('/user', fn (Request $request) => $request->user());

    // ── NO ROLE RESTRICTION — any authenticated user can call this ────────────
    // Placed outside all role middleware groups so cashiers can call it.
    // The PIN itself is what determines authorization, not the caller's role.
    Route::post('/auth/verify-manager-pin', [UserController::class, 'verifyManagerPin']);

    // ── CASHIER + BRANCH MANAGER + SUPERADMIN ────────────────────────────────
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
            Route::get('/',         [CashTransactionController::class, 'index']);
            Route::post('/',        [CashTransactionController::class, 'store']);
            Route::get('/status',   [CashCountController::class, 'checkInitialCash']);
            Route::post('/cash-in', [CashCountController::class, 'storeCashIn']);
        });

        Route::get('/receipts/search',              [ReceiptController::class, 'search']);
        Route::get('/receipts/next-sequence',       [ReceiptController::class, 'getNextSequence']);
        Route::post('/receipts/{id}/void-request',  [ReceiptController::class, 'voidRequest']);
        Route::post('/void-requests/{id}/approve',  [ReceiptController::class, 'approveVoid']);
        Route::get('/receipts/{id}/reprint',        [ReceiptController::class, 'reprint']);

        Route::prefix('cash-counts')->group(function () {
            Route::post('/',       [CashCountController::class, 'store']);
            Route::get('/status',  [CashCountController::class, 'checkEodStatus']);
            Route::get('/summary', [ReportController::class, 'getCashCountSummary']);
        });

        Route::get('/cache/all',             [CacheController::class, 'all']);
        Route::get('/menu',                  [MenuController::class, 'index']);
        Route::post('/menu/clear-cache',     [MenuController::class, 'clearCache']);
        Route::get('/notifications/summary', [NotificationController::class, 'summary']);
        Route::post('/audit-logs',           [AuditLogController::class, 'store']);
        Route::apiResource('menu-list',  MenuListController::class)->only(['index', 'store']);
        Route::apiResource('menu-items', MenuItemController::class);
        Route::get('/menu-item-options',       [MenuItemOptionController::class, 'index']);
        Route::get('/menu-item-options/bulk',  [MenuItemOptionController::class, 'bulk']);
        Route::put('/menu-item-options/{id}',  [MenuItemOptionController::class, 'update']);
        Route::get('/add-ons',     [AddOnController::class, 'index']);
        Route::get('/bundles',     [BundleController::class, 'index']);
        Route::get('/category-drinks', [CategoryDrinkController::class, 'index']);
        Route::apiResource('categories',     CategoryController::class);
        Route::apiResource('sub-categories', SubCategoryController::class);
        Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);
        Route::get('/cups', [CupController::class, 'index']);

        Route::prefix('inventory')->group(function () {
            Route::get('/',             [InventoryController::class, 'index']);
            Route::get('/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
            Route::get('/history',      [InventoryController::class, 'getTransactionHistory']);
        });

        Route::get('/raw-materials/low-stock',             [RawMaterialController::class, 'lowStock']);
        Route::get('/raw-materials/movements',             [RawMaterialController::class, 'movements']);
        Route::get('/raw-materials/{rawMaterial}/history', [RawMaterialController::class, 'history']);
        Route::apiResource('raw-materials', RawMaterialController::class)->only(['index', 'show']);

        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('/item-serials',    [ItemSerialController::class, 'index']);

        Route::get('/recipes',   [RecipeController::class, 'index']);
        Route::get('/expenses',  [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);

        Route::prefix('discounts')->group(function () {
            Route::get   ('/',                    [DiscountController::class, 'index']);
            Route::post  ('/',                    [DiscountController::class, 'store']);
            Route::put   ('/{discount}',          [DiscountController::class, 'update']);
            Route::put   ('/{discount}/toggle',   [DiscountController::class, 'toggleStatus']);
            Route::put   ('/{discount}/branches', [DiscountController::class, 'updateBranches']);
            Route::post  ('/{discount}/use',      [DiscountController::class, 'recordUsage']);
            Route::delete('/{discount}',          [DiscountController::class, 'destroy']);
        });

        Route::prefix('reports')->group(function () {
            Route::get('/inventory',         [InventoryReportController::class, 'index']);
            Route::get('/x-reading',         [SalesDashboardController::class, 'xReading']);
            Route::get('/z-reading/history', [SalesDashboardController::class, 'zReadingHistory']);
            Route::get('/z-reading',         [SalesDashboardController::class, 'zReading']);
            Route::get('/items-report',      [ItemsReportController::class, 'getItemsSoldReport']);
            Route::get('/hourly-sales',      [ReportController::class, 'getHourlySales']);
            Route::get('/void-logs',         [ReportController::class, 'getVoidLogs']);
            Route::get('/item-quantities',   [ReportController::class, 'getItemQuantities']);
            Route::get('/sales',             [ReportController::class, 'getSalesReport']);
            Route::get('/sales-summary',     [ReportController::class, 'getSalesSummary']);
            Route::get('/sales-detailed',    [ReportController::class, 'getSalesDetailed']);
            Route::get('/dashboard-data',    [SalesDashboardController::class, 'dashboardData']);
            Route::get('/food-menu',         [ReportController::class, 'getFoodMenu']);
            Route::get('/export-sales',      [ReportController::class, 'exportSales']);
            Route::get('/export-items',      [ReportController::class, 'exportItems']);
        });
    });

    // ── BRANCH MANAGER + SUPERADMIN ──────────────────────────────────────────
    Route::middleware(['role:superadmin,branch_manager'])->group(function () {

        Route::prefix('inventory')->group(function () {
            Route::post('/',               [InventoryController::class, 'store']);
            Route::get('/check/{barcode}', [InventoryController::class, 'checkByBarcode']);
            Route::patch('/{id}/quantity', [InventoryController::class, 'updateQuantity']);
            Route::get('/overview',        [InventoryController::class, 'overview']);
            Route::get('/alerts',          [InventoryController::class, 'alerts']);
            Route::get('/usage-report',    [InventoryController::class, 'usageReport']);
            Route::get('/usage-report/export', [InventoryController::class, 'exportUsageReport']);
        });

        Route::prefix('purchase-orders')->group(function () {
            Route::post('/',             [PurchaseOrderController::class, 'store']);
            Route::patch('/{id}/status', [PurchaseOrderController::class, 'updateStatus']);
        });

        Route::prefix('item-serials')->group(function () {
            Route::post('/',             [ItemSerialController::class, 'store']);
            Route::patch('/{id}/status', [ItemSerialController::class, 'updateStatus']);
        });

        Route::apiResource('expenses', ExpenseController::class)->only(['store']);

        Route::get('/branch/audit-logs', [AuditLogController::class, 'branchIndex']);
        Route::apiResource('discounts', DiscountController::class)->except(['show', 'update', 'index']);
        Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);
        Route::apiResource('vouchers',  VoucherController::class)->only(['index', 'store']);
        Route::apiResource('suppliers', SupplierController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::prefix('stock-transfers')->group(function () {
            Route::get ('/',                        [StockTransferController::class, 'index']);
            Route::post('/',                        [StockTransferController::class, 'store']);
            Route::post('/{stockTransfer}/approve', [StockTransferController::class, 'approve']);
            Route::post('/{stockTransfer}/receive', [StockTransferController::class, 'receive']);
            Route::post('/{stockTransfer}/cancel',  [StockTransferController::class, 'cancel']);
        });

        Route::prefix('reports')->group(function () {
            Route::get('/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
        });

        Route::get('/settings',  [SettingsController::class, 'index']);
        Route::post('/settings', [SettingsController::class, 'update']);
        Route::get('/item-checker/search',    [ItemCheckerController::class, 'search']);
        Route::get('/item-checker/{barcode}', [ItemCheckerController::class, 'lookup']);

        Route::prefix('users')->group(function () {
            Route::get('/',                     [UserController::class, 'index']);
            Route::post('/',                    [UserController::class, 'store']);
            Route::get('/stats',                [UserController::class, 'stats']);
            Route::get('/{id}',                 [UserController::class, 'show']);
            Route::put('/{id}',                 [UserController::class, 'update']);
            Route::delete('/{id}',              [UserController::class, 'destroy']);
            Route::patch('/{id}/toggle-status', [UserController::class, 'toggleStatus']);
            Route::patch('/{id}/pin',           [UserController::class, 'updatePin']);
        });

        Route::prefix('branches')->group(function () {
            Route::get('/performance',        [BranchController::class, 'performance']);
            Route::get('/today-sales',        [BranchController::class, 'todaySales']);
            Route::get('/ownership-summary',  [BranchController::class, 'ownershipSummary']);
            Route::get('/',                   [BranchController::class, 'index']);
            Route::get('/{id}/daily-sales',   [BranchController::class, 'dailySales']);
            Route::get('/{id}/sales-summary', [BranchController::class, 'salesSummary']);
            Route::get('/{id}/analytics',     [BranchController::class, 'analytics']);
            Route::get('/{id}',               [BranchController::class, 'show']);
        });

        Route::post('/raw-materials/{rawMaterial}/adjust', [RawMaterialController::class, 'adjust']);
        Route::apiResource('raw-materials', RawMaterialController::class)->except(['index', 'show']);

        Route::get('/recipes/by-menu-item/{menuItemId}', [RecipeController::class, 'byMenuItem']);
        Route::patch('/recipes/{recipe}/toggle',         [RecipeController::class, 'toggle']);
        Route::apiResource('recipes', RecipeController::class)->except(['index', 'show']);
    });

    // ── SUPERADMIN ONLY ──────────────────────────────────────────────────────
    Route::middleware(['role:superadmin'])->group(function () {

        Route::get('/audit-logs',       [AuditLogController::class, 'index']);
        Route::get('/audit-logs/stats', [AuditLogController::class, 'stats']);

        Route::prefix('reports')->group(function () {
            Route::get('/admin-sales-summary', [SuperAdminReportController::class, 'salesSummary']);
            Route::get('/branch-comparison',   [SuperAdminReportController::class, 'branchComparison']);
            Route::get('/z-reading/history',   [SalesDashboardController::class, 'zReadingHistory']);
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

        Route::prefix('bundles')->group(function () {
            Route::get   ('/all',         [BundleController::class, 'all']);
            Route::get   ('/{id}',        [BundleController::class, 'show']);
            Route::post  ('/',            [BundleController::class, 'store']);
            Route::put   ('/{id}',        [BundleController::class, 'update']);
            Route::delete('/{id}',        [BundleController::class, 'destroy']);
            Route::patch ('/{id}/toggle', [BundleController::class, 'toggle']);
        });

        Route::prefix('category-drinks')->group(function () {
            Route::post('/', [CategoryDrinkController::class, 'store']);
        });

        // ── POS DEVICE MANAGEMENT ─────────────────────────────────────────────
        Route::prefix('pos-devices')->group(function () {
            Route::get   ('/',                [PosDeviceController::class, 'index']);
            Route::post  ('/',                [PosDeviceController::class, 'register']);
            Route::patch ('/{id}/toggle',     [PosDeviceController::class, 'toggleStatus']);
            Route::patch ('/{id}/assign',     [PosDeviceController::class, 'assignUser']);    // ← ADD
            Route::delete('/{id}/unassign',   [PosDeviceController::class, 'unassignUser']); // ← ADD
            Route::delete('/{id}',            [PosDeviceController::class, 'destroy']);
        });
        // ─────────────────────────────────────────────────────────────────────
    });
});