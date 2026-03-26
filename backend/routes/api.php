<?php

use App\Http\Controllers\Api\{ BackupController, CashCountController, CashTransactionController, CategoryController, DashboardController, DiscountController, ExpenseController, InventoryController, StockTransferController, InventoryDashboardController, InventoryReportController, ItemSerialController, MenuController, MenuListController, PurchaseOrderController, ReceiptController, ReportController, SalesController, SalesDashboardController, SettingsController, SubCategoryController, UploadController, VoucherController, BranchController, AddOnController, SuperAdminReportController, CardPurchaseController, MenuItemController, SupplierController, ItemCheckerController };
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BundleController;
use App\Http\Controllers\Api\CupController;
use App\Http\Controllers\Api\ItemsReportController;
use App\Http\Controllers\Api\MenuItemOptionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\CacheController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\PaymentSettingController;
use App\Http\Controllers\CategoryDrinkController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

// ── PUBLIC AUTH ─────────────────────────────────────────────────────────────
Route::post('/login',  [AuthController::class, 'login'])->middleware('throttle:5,2');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/google-login', [AuthController::class, 'googleLogin']);

// ── CUSTOMER APP PUBLIC ROUTES ──────────────────────────────────────────────
Route::get('/cards',                      [CardController::class, 'index']);
Route::get('/payment-settings',           [PaymentSettingController::class, 'index']);
Route::post('/purchase-card',             [CardPurchaseController::class, 'purchase']);
Route::get('/check-card-status/{userId}', [CardPurchaseController::class, 'checkStatus']);

// ── PUBLIC MENU (Optimized for Flutter) ──────────────────────────────────────
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
        ->filter(fn($item) => !is_null($item->category) && $item->category !== '')
        ->values()
        ->map(function ($item) {
            $item->image = $item->image ? url('storage/' . $item->image) : null;
            return $item;
        });

    $json = json_encode($items, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return response($json, 200)
        ->header('Content-Type', 'application/json; charset=utf-8')
        ->header('Content-Length', strlen($json));
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
    $token = $user->createToken('auth-token')->plainTextToken;
    return response()->json(['token' => $token, 'user' => $user], 201);
});

// ── AUTHENTICATED ROUTES ─────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/auth/verify-manager-pin', [UserController::class, 'verifyManagerPin']);
    Route::post('/sales', [SalesController::class, 'store']);
     Route::get('/my-orders', [SalesController::class, 'myOrders']);

    // ── CUSTOMER: update own display name ────────────────────────────────────
    Route::put('/user/name', function (Request $request) {
        $request->validate(['name' => 'required|string|max:30']);
        $request->user()->update(['name' => $request->name]);
        return response()->json([
            'message' => 'Display name updated successfully.',
            'name'    => $request->name,
        ]);
    });

    // ── CUSTOMER: update profile picture ─────────────────────────────────────
    Route::post('/user/avatar', function (Request $request) {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:5120', // Max 5MB
        ]);

        $user = $request->user();

        if ($request->hasFile('image')) {
            // Save the file to storage/app/public/avatars
            $path = $request->file('image')->store('avatars', 'public');
            
            // NOTE: Make sure your `users` database table has an 'avatar' column!
            $user->update(['avatar' => $path]);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture updated successfully.',
                'image_url' => url('storage/' . $path),
            ], 200);
        }

        return response()->json(['message' => 'No image provided.'], 400);
    });

    Route::post('/cards/use-promo', [CardPurchaseController::class, 'usePromo']);

    // ── CASHIER + BRANCH MANAGER + SUPERADMIN ────────────────────────────────
    Route::middleware(['role:superadmin,branch_manager,cashier'])->group(function () {

        Route::get('/dashboard/stats', [DashboardController::class, 'index']);
        Route::get('/app-init',        [DashboardController::class, 'init']);
        Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);

        Route::prefix('sales')->group(function () {
        Route::get('/',                    [SalesController::class, 'index']);
        Route::get('/online-orders',       [SalesController::class, 'onlineOrders']); // 👈 add
        Route::get('/{id}',                [SalesController::class, 'show']);
        Route::patch('/{id}/cancel',       [SalesController::class, 'cancel']);
        Route::patch('/{id}/fulfill',      [SalesController::class, 'fulfill']);      // 👈 add
    });

        Route::prefix('cash-transactions')->group(function () {
            Route::get('/',         [CashTransactionController::class, 'index']);
            Route::post('/',        [CashTransactionController::class, 'store']);
            Route::get('/status',   [CashCountController::class, 'checkInitialCash']);
            Route::post('/cash-in', [CashCountController::class, 'storeCashIn']);
        });

        Route::get('/receipts/search',                    [ReceiptController::class, 'search']);
        Route::get('/receipts/next-sequence',             [ReceiptController::class, 'getNextSequence']);
        Route::post('/receipts/{id}/void-request',        [ReceiptController::class, 'voidRequest']);
        Route::post('/void-requests/{id}/approve',        [ReceiptController::class, 'approveVoid']);
        Route::get('/receipts/{id}/reprint',              [ReceiptController::class, 'reprint']);

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

        Route::apiResource('menu-list',   MenuListController::class)->only(['index', 'store']);
        Route::apiResource('menu-items',  MenuItemController::class);
        Route::get('/menu-item-options',       [MenuItemOptionController::class, 'index']);
        Route::get('/menu-item-options/bulk',  [MenuItemOptionController::class, 'bulk']);
        Route::put('/menu-item-options/{id}',  [MenuItemOptionController::class, 'update']);
        Route::get('/add-ons',                 [AddOnController::class, 'index']);
        Route::get('/bundles',                 [BundleController::class, 'index']);
        Route::get('/category-drinks',         [CategoryDrinkController::class, 'index']);

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
        Route::get('/recipes',         [RecipeController::class, 'index']);
        Route::get('/expenses',        [ExpenseController::class, 'index']);
        Route::post('/expenses',       [ExpenseController::class, 'store']);

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
            Route::post('/',                [InventoryController::class, 'store']);
            Route::get('/check/{barcode}',  [InventoryController::class, 'checkByBarcode']);
            Route::patch('/{id}/quantity',  [InventoryController::class, 'updateQuantity']);
            Route::get('/overview',         [InventoryController::class, 'overview']);
            Route::get('/alerts',           [InventoryController::class, 'alerts']);
            Route::get('/usage-report',     [InventoryController::class, 'usageReport']);
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

        Route::get('/branch/audit-logs', [AuditLogController::class, 'branchIndex']);
        Route::apiResource('vouchers',  VoucherController::class)->only(['index', 'store']);
        Route::apiResource('suppliers', SupplierController::class)->only(['index','store','update','destroy']);

        Route::prefix('stock-transfers')->group(function () {
            Route::get ('/',                         [StockTransferController::class, 'index']);
            Route::post('/',                         [StockTransferController::class, 'store']);
            Route::post('/{stockTransfer}/approve',  [StockTransferController::class, 'approve']);
            Route::post('/{stockTransfer}/receive',  [StockTransferController::class, 'receive']);
            Route::post('/{stockTransfer}/cancel',   [StockTransferController::class, 'cancel']);
        });

        Route::get('/settings',              [SettingsController::class, 'index']);
        Route::post('/settings',             [SettingsController::class, 'update']);
        Route::get('/item-checker/search',   [ItemCheckerController::class, 'search']);
        Route::get('/item-checker/{barcode}',[ItemCheckerController::class, 'lookup']);

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

        Route::prefix('admin/cards')->group(function () {
            Route::get   ('/',             [CardController::class, 'adminIndex']);
            Route::post  ('/',             [CardController::class, 'store']);
            Route::post  ('/{id}',         [CardController::class, 'update']);
            Route::patch ('/{id}/toggle',  [CardController::class, 'toggle']);
            Route::delete('/{id}',         [CardController::class, 'destroy']);
        });

        // ── ADMIN CARD APPROVALS & USERS (For the React Dashboard) ───────────
        Route::prefix('admin/cards')->group(function () {
            Route::get('/pending',          [CardPurchaseController::class, 'getPending']);
            Route::post('/{id}/approve',    [CardPurchaseController::class, 'approve']);
            Route::post('/{id}/reject',     [CardPurchaseController::class, 'reject']);

            // ── USAGE ROUTES ──
            Route::get('/users',                     [CardPurchaseController::class, 'getCardUsers']);
            Route::post('/users/{userId}/log-usage', [CardPurchaseController::class, 'logPromoUsage']);
        });

        Route::prefix('reports')->group(function () {
            Route::get('/admin-sales-summary', [SuperAdminReportController::class, 'salesSummary']);
            Route::get('/branch-comparison',   [SuperAdminReportController::class, 'branchComparison']);
        });

        Route::prefix('system')->group(function () {
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
            Route::post  ('/',            [BundleController::class, 'store']);
            Route::put   ('/{id}',        [BundleController::class, 'update']);
            Route::delete('/{id}',        [BundleController::class, 'destroy']);
            Route::patch ('/{id}/toggle', [BundleController::class, 'toggle']);
        });

        Route::prefix('category-drinks')->group(function () {
            Route::post('/', [CategoryDrinkController::class, 'store']);
        });
    });
});