<?php

use App\Http\Controllers\Api\{ BackupController, BranchSettingsController, CashCountController, CashTransactionController, CategoryController, DashboardController, DiscountController, ExpenseController, InventoryController, StockTransferController, InventoryDashboardController, InventoryReportController, ItemSerialController, MenuController, MenuListController, PurchaseOrderController, ReceiptController, RecipeController, ReportController, SalesController, SalesDashboardController, SearchController, SettingsController, SubCategoryController, UploadController, VoucherController, BranchController, AddOnController, SuperAdminReportController, CardPurchaseController, MenuItemController, SupplierController, ItemCheckerController, PulseController, StaffPerformanceController, InventoryAlertController };
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchManagerAppController; // ✅ FIXED: now in Api namespace
use App\Http\Controllers\Api\BundleController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\CupController;
use App\Http\Controllers\Api\ItemsReportController;
use App\Http\Controllers\Api\MenuItemOptionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PosDeviceController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\SugarLevelController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\CacheController;
use App\Http\Controllers\CategoryDrinkController;
use App\Http\Controllers\OnlineOrderController;
use App\Http\Controllers\Api\PointsController;
use App\Http\Controllers\LoyaltyManagementController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/login',         [AuthController::class, 'login']);
Route::post('/verify-2fa',    [AuthController::class, 'verify2FA']);
Route::post('/resend-2fa',    [AuthController::class, 'resend2FA']);
Route::post('/google-login',  [AuthController::class, 'googleLogin']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── LOYALTY (Mobile & Shared) ──────────────────────────────────────────
    Route::get('/loyalty/rewards', [LoyaltyManagementController::class, 'getRewards']);

    Route::patch('/orders/{siNumber}/cancel', function (Request $request, string $siNumber) {
        $sale = \App\Models\Sale::where('invoice_number', $siNumber)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($sale->status !== 'pending') {
            return response()->json([
                'message' => 'Order can only be cancelled while pending.',
            ], 422);
        }

        $sale->status = 'cancelled';
        $sale->save();

        return response()->json(['message' => 'Order cancelled successfully.']);
    });

    Route::post('/sales',     [SalesController::class, 'store']);
    Route::get('/sales/{id}', [SalesController::class, 'show']);

    Route::get('/user', function (Request $request) {
        $user   = $request->user();
        $branch = $user->branch_id
            ? \App\Models\Branch::select('id', 'vat_type')->find($user->branch_id)
            : null;

        return array_merge($user->toArray(), [
            'branch_vat_type' => $branch?->vat_type ?? 'vat',
        ]);
    });

    // ── USER PROFILE UPDATES (Mobile App) ────────────────────────────────────
    Route::put('/user/name', function (Request $request) {
        $request->validate(['name' => 'required|string|max:255']);
        $user       = $request->user();
        $user->name = $request->name;
        $user->save();
        return response()->json(['message' => 'Name updated successfully', 'user' => $user]);
    });

    Route::put('/user/{id}/update-email', function (Request $request, $id) {
        $request->validate([
            'email'    => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'required|string',
        ]);

        $user = $request->user();

        // Ensure the authenticated user matches the target ID
        if ((string) $user->id !== (string) $id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Verify current password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        $user->email = $request->email;
        $user->save();

        return response()->json([
            'message' => 'Email updated successfully.',
            'user'    => $user,
        ]);
    });

    Route::post('/user/avatar', function (Request $request) {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('avatars', 'public');
            return response()->json([
                'message' => 'Avatar uploaded successfully!',
                'path'    => url('storage/' . $path),
            ]);
        }

        return response()->json(['message' => 'No image file provided.'], 400);
    });
    // ─────────────────────────────────────────────────────────────────────────

    // ── NO ROLE RESTRICTION ───────────────────────────────────────────────────
    Route::post('/auth/verify-manager-pin', [UserController::class, 'verifyManagerPin']);

    // ── CASHIER + BRANCH MANAGER + SUPERADMIN ────────────────────────────────
    Route::middleware(['role:superadmin,branch_manager,supervisor,cashier,team_leader'])->group(function () {


        Route::get   ('/online-orders',            [OnlineOrderController::class, 'index']);
        Route::patch ('/online-orders/{id}/status',[OnlineOrderController::class, 'updateStatus']);

        // ── Branch Manager App Routes ─────────────────────────────────────────
        Route::get   ('branch/app-orders',              [BranchManagerAppController::class, 'appOrders']);
        Route::patch ('branch/app-orders/{id}/status',  [BranchManagerAppController::class, 'updateStatus']);
        Route::get   ('branch/menu-items',              [BranchManagerAppController::class, 'menuItems']);
        Route::post  ('branch/menu-items/{id}/toggle',  [BranchManagerAppController::class, 'toggleMenuItem']);
        
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
        });

        Route::prefix('reports')->group(function () {
            Route::get('/inventory',         [InventoryReportController::class, 'index']);
            Route::get('/x-reading',         [SalesDashboardController::class,  'xReading']);
            Route::get('/z-reading/history', [SalesDashboardController::class,  'zReadingHistory']);
            Route::get('/z-reading',         [SalesDashboardController::class,  'zReading']);
            Route::get('/items-report',      [ItemsReportController::class,     'getItemsSoldReport']);
            Route::get('/hourly-sales',      [ReportController::class,          'getHourlySales']);
            Route::get('/void-logs',         [ReportController::class,          'getVoidLogs']);
            Route::get('/item-quantities',   [ReportController::class,          'getItemQuantities']);
            Route::get('/sales',             [ReportController::class,          'getSalesReport']);
            Route::get('/sales-summary',     [ReportController::class,          'getSalesSummary']);
            Route::get('/sales-detailed',    [ReportController::class,          'getSalesDetailed']);
            Route::get('/dashboard-data',    [SalesDashboardController::class,  'dashboardData']);
            Route::get('/food-menu',         [ReportController::class,          'getFoodMenu']);
            Route::get('/export-sales',      [ReportController::class,          'exportSales']);
            Route::get('/export-items',      [ReportController::class,          'exportItems']);
        });
        // ── Z Reading print + close ───────────────────────────────────────────────────
        Route::prefix('readings')->group(function () {
            Route::post('/z/close',       [SalesDashboardController::class, 'zReadingClose']);
            Route::post('/z/print-token', [SalesDashboardController::class, 'zReadingPrintToken']);
        });

        // ── Branch read routes (cashiers need these) ──────────────────────────
        Route::get('/branches/ownership-summary', [BranchController::class, 'ownershipSummary']);
        Route::get('/branches/performance',       [BranchController::class, 'performance']);
        Route::get('/branches/today-sales',       [BranchController::class, 'todaySales']);

        Route::get ('/branches', [BranchController::class, 'index']);

        Route::prefix('stock-transfers')->group(function () {
            Route::get ('/',                         [StockTransferController::class, 'index']);
            Route::post('/',                         [StockTransferController::class, 'store']);
            Route::post('/{stockTransfer}/approve',  [StockTransferController::class, 'approve']);
            Route::post('/{stockTransfer}/receive',  [StockTransferController::class, 'receive']);
            Route::post('/{stockTransfer}/cancel',   [StockTransferController::class, 'cancel']);
        });

        Route::get('/users', [UserController::class, 'index']);
    });

    // ── BRANCH MANAGER + SUPERADMIN ──────────────────────────────────────────
    Route::middleware(['role:superadmin,branch_manager'])->group(function () {

        Route::get('/branch/audit-logs', [AuditLogController::class, 'branchIndex']);

        Route::prefix('inventory')->group(function () {
            Route::get ('/',                       [InventoryController::class, 'index']);
            Route::post('/',                       [InventoryController::class, 'store']);
            Route::get ('/check/{barcode}',        [InventoryController::class, 'checkByBarcode']);
            Route::patch('/{id}/quantity',         [InventoryController::class, 'updateQuantity']);
            Route::get ('/overview',               [InventoryController::class, 'overview']);
            Route::get ('/alerts',                 [InventoryController::class, 'alerts']);
            Route::get ('/usage-report',           [InventoryController::class, 'usageReport']);
            Route::get ('/usage-report/export',    [InventoryController::class, 'exportUsageReport']);
        });

        Route::prefix('purchase-orders')->group(function () {
            Route::get  ('/',             [PurchaseOrderController::class, 'index']);
            Route::post ('/',             [PurchaseOrderController::class, 'store']);
            Route::patch('/{id}/status',  [PurchaseOrderController::class, 'updateStatus']);
        });

        Route::prefix('item-serials')->group(function () {
            Route::post ('/',             [ItemSerialController::class, 'store']);
            Route::patch('/{id}/status',  [ItemSerialController::class, 'updateStatus']);
        });

        Route::apiResource('expenses', ExpenseController::class)->only(['store']);

        Route::apiResource('discounts', DiscountController::class)->except(['show', 'update', 'index']);
        Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);
        Route::apiResource('vouchers',  VoucherController::class)->only(['index', 'store']);
        Route::apiResource('suppliers', SupplierController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::prefix('reports')->group(function () {
            Route::get('/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
        });

        Route::get  ('/settings', [SettingsController::class, 'index']);
        Route::post ('/settings', [SettingsController::class, 'update']);
        Route::patch('/settings', [SettingsController::class, 'update']);

        Route::get('/item-checker/search',    [ItemCheckerController::class, 'search']);
        Route::get('/item-checker/{barcode}', [ItemCheckerController::class, 'lookup']);

        Route::prefix('users')->group(function () {
            Route::post  ('/',                    [UserController::class, 'store']);
            Route::get   ('/stats',               [UserController::class, 'stats']);
            Route::get   ('/{id}',                [UserController::class, 'show']);
            Route::put   ('/{id}',                [UserController::class, 'update']);
            Route::delete('/{id}',                [UserController::class, 'destroy']);
            Route::patch ('/{id}/toggle-status',  [UserController::class, 'toggleStatus']);
            Route::patch ('/{id}/pin',            [UserController::class, 'updatePin'])->middleware('throttle:5,1');
        });

        Route::prefix('branches')->group(function () {
            Route::post  ('/',                    [BranchController::class, 'store']);
            Route::get   ('/{id}',                [BranchController::class, 'show']);
            Route::put   ('/{id}',                [BranchController::class, 'update']);
            Route::delete('/{id}',                [BranchController::class, 'destroy']);
            Route::get   ('/{id}/daily-sales',    [BranchController::class, 'dailySales']);
            Route::get   ('/{id}/analytics',      [BranchController::class, 'analytics']);
            Route::get   ('/{id}/sales-summary',  [BranchController::class, 'salesSummary']);
            Route::post  ('/{id}/refresh-totals', [BranchController::class, 'refreshTotals']);
        });

    });

    // ── SUPERADMIN ONLY ───────────────────────────────────────────────────────
    Route::middleware(['role:superadmin'])->group(function () {
        Route::get('/pulse', [PulseController::class, 'index']);
        Route::get('/search', [SearchController::class, 'index']);
        Route::get('/inventory-alerts', [InventoryAlertController::class, 'index']);
        Route::get('/staff-performance', [StaffPerformanceController::class, 'index']);
        
        Route::get('/notifications/summary', [NotificationController::class, 'summary']);
        Route::get('/pos-devices', [PosDeviceController::class, 'index']);
        
        // Moved from branch_manager block to restrict editing to SuperAdmin only
        Route::post('/raw-materials/{rawMaterial}/adjust', [RawMaterialController::class, 'adjust']);
        Route::apiResource('raw-materials', RawMaterialController::class)->except(['index', 'show']);

        Route::get  ('/recipes/by-menu-item/{menuItemId}', [RecipeController::class, 'byMenuItem']);
        Route::patch('/recipes/{recipe}/toggle',           [RecipeController::class, 'toggle']);
        Route::apiResource('recipes', RecipeController::class)->except(['index', 'show']);

        Route::get('/audit-logs',        [AuditLogController::class, 'index']);
        Route::get('/audit-logs/export', [AuditLogController::class, 'export']);
        Route::get('/audit-logs/stats',  [AuditLogController::class, 'stats']);

        Route::prefix('reports')->group(function () {
            Route::get('/z-reading/history',   [SalesDashboardController::class,   'zReadingHistory']);
            Route::get('/items-all',           [SuperAdminReportController::class, 'itemsReport']);
            Route::get('/items-export',        [SuperAdminReportController::class, 'exportItems']);
            Route::get('/admin-sales-summary', [SuperAdminReportController::class, 'salesSummary']);
            Route::get('/branch-comparison',   [SuperAdminReportController::class, 'branchComparison']);
        });

        Route::prefix('system')->group(function () {
            Route::get ('/info',              [SettingsController::class, 'getSystemInfo']);
            Route::get ('/audit',             [SettingsController::class, 'getAuditLogs']);
            Route::delete('/audit/clear',     [SettingsController::class, 'clearAuditLogs']);
            Route::post('/reset',             [SettingsController::class, 'resetSystem']);
            Route::get ('/backup-status',     [BackupController::class,   'lastBackupStatus']);
            Route::post('/run-backup',        [BackupController::class,   'runBackup']);
            Route::post('/upload',            [UploadController::class,   'upload']);
            Route::get ('/import-history',    [UploadController::class,   'importHistory']);
            Route::post('/upload-discounts',  [UploadController::class,   'uploadDiscounts']);
        });

        Route::prefix('branches')->group(function () {
            Route::post  ('/',                    [BranchController::class, 'store']);
            Route::put   ('/{id}',                [BranchController::class, 'update']);
            Route::delete('/{id}',                [BranchController::class, 'destroy']);
            Route::post  ('/{id}/refresh-totals', [BranchController::class, 'refreshTotals']);
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

        Route::prefix('sugar-levels')->group(function () {
            Route::get   ('/all',     [SugarLevelController::class, 'adminIndex']);
            Route::post  ('/',        [SugarLevelController::class, 'store']);
            Route::put   ('/{id}',    [SugarLevelController::class, 'update']);
            Route::delete('/{id}',    [SugarLevelController::class, 'destroy']);
            Route::patch ('/reorder', [SugarLevelController::class, 'reorder']);
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
            Route::get ('/top-products',      [InventoryDashboardController::class, 'getWeeklyTopProducts']);
            
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

        // ── LOYALTY MANAGEMENT (SuperAdmin) ──────────────────────────────────
        Route::prefix('loyalty')->group(function () {
            Route::get   ('/settings',     [LoyaltyManagementController::class, 'getSettings']);
            Route::post  ('/settings',     [LoyaltyManagementController::class, 'updateSettings']);
            Route::get   ('/users',        [LoyaltyManagementController::class, 'getUserPoints']);
            Route::post  ('/rewards',      [LoyaltyManagementController::class, 'storeReward']);
            Route::put   ('/rewards/{id}', [LoyaltyManagementController::class, 'updateReward']);
            Route::delete('/rewards/{id}', [LoyaltyManagementController::class, 'deleteReward']);
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
        Route::get   ('/summary', [CashCountController::class, 'summary']);
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