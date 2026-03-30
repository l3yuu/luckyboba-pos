<?php

use App\Http\Controllers\Api\{ BackupController, CashCountController, CashTransactionController, CategoryController, DashboardController, DiscountController, ExpenseController, InventoryController, StockTransferController, InventoryDashboardController, InventoryReportController, ItemSerialController, MenuController, MenuListController, PurchaseOrderController, ReceiptController, ReportController, SalesController, SalesDashboardController, SettingsController, SubCategoryController, UploadController, VoucherController, BranchController, AddOnController, SuperAdminReportController, CardPurchaseController, MenuItemController, SupplierController, ItemCheckerController };
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
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\CacheController;
use App\Http\Controllers\CategoryDrinkController;
use App\Http\Controllers\OnlineOrderController;
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

// ✅ PUBLIC MOBILE ROUTES
Route::get('/cards',            [CardController::class, 'index']);
Route::get('/payment-settings', [SettingsController::class, 'index']);
Route::get('/add-ons',          [AddOnController::class, 'index']);

// ── PUBLIC MENU ───────────────────────────────────────────────────────────────
Route::get('/public-menu', function (Illuminate\Http\Request $request) {

    $branchId = $request->query('branch_id');

    // Load branch-specific overrides if branch_id is provided
    $branchOverrides = collect();
if ($branchId) {
    try {
        $branchOverrides = DB::table('branch_menu_availability')
            ->where('branch_id', $branchId)
            ->pluck('is_available', 'menu_item_id');
    } catch (\Exception $e) {
        // Table doesn't exist yet, skip overrides
        $branchOverrides = collect();
    }
}

    $items = DB::table('menu_items')
        ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
        ->select(
            'menu_items.id',
            'menu_items.name',
            'menu_items.barcode',
            'menu_items.quantity',
            'menu_items.status',
            'categories.name as category',
            'menu_items.price as sellingPrice',
            'menu_items.image'
        )
        ->where('menu_items.status', 'active') // globally inactive = always hidden
        ->get()
        ->filter(function ($item) use ($branchOverrides) {
            // If this branch has an override, respect it
            if ($branchOverrides->has($item->id)) {
                return (bool) $branchOverrides->get($item->id);
            }
            return true;
        })
        ->filter(function ($item) {
            return !is_null($item->category) && $item->category !== '';
        })
        ->values()
        ->map(function ($item) {
            $item->image = $item->image
                ? url('storage/' . $item->image)
                : null;
            unset($item->status);
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
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    Route::post('/online-orders', [OnlineOrderController::class, 'store']);
    Route::get('/my-orders',      [OnlineOrderController::class, 'myOrders']);

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
    Route::middleware(['role:superadmin,branch_manager,cashier,team_leader'])->group(function () {

        Route::get   ('/online-orders',            [OnlineOrderController::class, 'index']);
        Route::patch ('/online-orders/{id}/status',[OnlineOrderController::class, 'updateStatus']);

        // ── Branch Manager App Routes ─────────────────────────────────────────
        Route::get   ('branch/app-orders',              [BranchManagerAppController::class, 'appOrders']);
        Route::patch ('branch/app-orders/{id}/status',  [BranchManagerAppController::class, 'updateStatus']);
        Route::get   ('branch/menu-items',              [BranchManagerAppController::class, 'menuItems']);
        Route::post  ('branch/menu-items/{id}/toggle',  [BranchManagerAppController::class, 'toggleMenuItem']);
        // ─────────────────────────────────────────────────────────────────────

        Route::get('/dashboard/stats', [DashboardController::class, 'index']);
        Route::get('/app-init',        [DashboardController::class, 'init']);
        Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);

        Route::prefix('sales')->group(function () {
            Route::get   ('/',           [SalesController::class, 'index']);
            Route::post  ('/',           [SalesController::class, 'store']);
            Route::get   ('/{id}',       [SalesController::class, 'show']);
            Route::patch ('/{id}/cancel',[SalesController::class, 'cancel']);
        });

        Route::prefix('cash-transactions')->group(function () {
            Route::get  ('/',         [CashTransactionController::class, 'index']);
            Route::post ('/',         [CashTransactionController::class, 'store']);
            Route::get  ('/status',   [CashCountController::class, 'checkInitialCash']);
            Route::post ('/cash-in',  [CashCountController::class, 'storeCashIn']);
        });

        Route::get  ('/receipts/search',             [ReceiptController::class, 'search']);
        Route::get  ('/receipts/next-sequence',      [ReceiptController::class, 'getNextSequence']);
        Route::post ('/receipts/{id}/void-request',  [ReceiptController::class, 'voidRequest']);
        Route::post ('/void-requests/{id}/approve',  [ReceiptController::class, 'approveVoid']);
        Route::get  ('/receipts/{id}/reprint',       [ReceiptController::class, 'reprint']);

        Route::prefix('cash-counts')->group(function () {
            Route::post ('/',        [CashCountController::class, 'store']);
            Route::get  ('/status',  [CashCountController::class, 'checkEodStatus']);
            Route::get  ('/summary', [ReportController::class,    'getCashCountSummary']);
        });

        Route::get  ('/cache/all',             [CacheController::class,      'all']);
        Route::get  ('/menu',                  [MenuController::class,        'index']);
        Route::post ('/menu/clear-cache',      [MenuController::class,        'clearCache']);
        Route::get  ('/notifications/summary', [NotificationController::class,'summary']);
        Route::post ('/audit-logs',            [AuditLogController::class,    'store']);

        Route::apiResource('menu-list',  MenuListController::class)->only(['index', 'store']);
        Route::apiResource('menu-items', MenuItemController::class);

        Route::get ('/menu-item-options',       [MenuItemOptionController::class, 'index']);
        Route::get ('/menu-item-options/bulk',  [MenuItemOptionController::class, 'bulk']);
        Route::put ('/menu-item-options/{id}',  [MenuItemOptionController::class, 'update']);

        Route::get('/bundles',         [BundleController::class,       'index']);
        Route::get('/category-drinks', [CategoryDrinkController::class,'index']);

        Route::apiResource('categories',     CategoryController::class);
        Route::apiResource('sub-categories', SubCategoryController::class);
        Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);

        Route::get('/cups',                                      [CupController::class,       'index']);
        Route::get('/sugar-levels',                              [SugarLevelController::class,'index']);
        Route::get('/sugar-levels/by-item/{menuItemId}',         [SugarLevelController::class,'byMenuItem']);

        Route::prefix('inventory')->group(function () {
            Route::get('/',             [InventoryController::class,          'index']);
            Route::get('/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
            Route::get('/history',      [InventoryController::class,          'getTransactionHistory']);
        });

        Route::get('/raw-materials/low-stock',             [RawMaterialController::class, 'lowStock']);
        Route::get('/raw-materials/movements',             [RawMaterialController::class, 'movements']);
        Route::get('/raw-materials/{rawMaterial}/history', [RawMaterialController::class, 'history']);
        Route::apiResource('raw-materials', RawMaterialController::class)->only(['index', 'show']);

        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('/item-serials',    [ItemSerialController::class,    'index']);

        Route::get ('/recipes',  [RecipeController::class, 'index']);
        Route::get ('/expenses', [ExpenseController::class,'index']);
        Route::post('/expenses', [ExpenseController::class,'store']);

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

        // ── Branch read routes (cashiers need these) ──────────────────────────
        Route::get('/branches/ownership-summary', [BranchController::class, 'ownershipSummary']);
        Route::get('/branches/performance',       [BranchController::class, 'performance']);
        Route::get('/branches/today-sales',       [BranchController::class, 'todaySales']);

        Route::get   ('/branches/{id}',                  [BranchController::class, 'show']);
        Route::put   ('/branches/{id}',                  [BranchController::class, 'update']);
        Route::delete('/branches/{id}',                  [BranchController::class, 'destroy']);
        Route::get   ('/branches/{id}/daily-sales',      [BranchController::class, 'dailySales']);
        Route::get   ('/branches/{id}/analytics',        [BranchController::class, 'analytics']);
        Route::get   ('/branches/{id}/sales-summary',    [BranchController::class, 'salesSummary']);
        Route::post  ('/branches/{id}/refresh-totals',   [BranchController::class, 'refreshTotals']);

        Route::get ('/branches', [BranchController::class, 'index']);
        Route::post('/branches', [BranchController::class, 'store']);
        // ─────────────────────────────────────────────────────────────────────

        Route::get('/users', [UserController::class, 'index']);
    });

    // ── BRANCH MANAGER + SUPERADMIN ──────────────────────────────────────────
    Route::middleware(['role:superadmin,branch_manager'])->group(function () {

        Route::get('/branch/audit-logs', [AuditLogController::class, 'branchIndex']);

        Route::prefix('inventory')->group(function () {
            Route::post('/',                       [InventoryController::class, 'store']);
            Route::get ('/check/{barcode}',        [InventoryController::class, 'checkByBarcode']);
            Route::patch('/{id}/quantity',         [InventoryController::class, 'updateQuantity']);
            Route::get ('/overview',               [InventoryController::class, 'overview']);
            Route::get ('/alerts',                 [InventoryController::class, 'alerts']);
            Route::get ('/usage-report',           [InventoryController::class, 'usageReport']);
            Route::get ('/usage-report/export',    [InventoryController::class, 'exportUsageReport']);
        });

        Route::prefix('purchase-orders')->group(function () {
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

        Route::prefix('stock-transfers')->group(function () {
            Route::get ('/',                         [StockTransferController::class, 'index']);
            Route::post('/',                         [StockTransferController::class, 'store']);
            Route::post('/{stockTransfer}/approve',  [StockTransferController::class, 'approve']);
            Route::post('/{stockTransfer}/receive',  [StockTransferController::class, 'receive']);
            Route::post('/{stockTransfer}/cancel',   [StockTransferController::class, 'cancel']);
        });

        Route::prefix('reports')->group(function () {
            Route::get('/mall-accreditation', [SalesDashboardController::class, 'mallReport']);
        });

        Route::get ('/settings', [SettingsController::class, 'index']);
        Route::post('/settings', [SettingsController::class, 'update']);

        Route::get('/item-checker/search',    [ItemCheckerController::class, 'search']);
        Route::get('/item-checker/{barcode}', [ItemCheckerController::class, 'lookup']);

        Route::prefix('users')->group(function () {
            Route::post  ('/',                    [UserController::class, 'store']);
            Route::get   ('/stats',               [UserController::class, 'stats']);
            Route::get   ('/{id}',                [UserController::class, 'show']);
            Route::put   ('/{id}',                [UserController::class, 'update']);
            Route::delete('/{id}',                [UserController::class, 'destroy']);
            Route::patch ('/{id}/toggle-status',  [UserController::class, 'toggleStatus']);
            Route::patch ('/{id}/pin',            [UserController::class, 'updatePin']);
        });

        Route::prefix('branches')->group(function () {
            Route::get('/performance',        [BranchController::class, 'performance']);
            Route::get('/today-sales',        [BranchController::class, 'todaySales']);
            Route::get('/ownership-summary',  [BranchController::class, 'ownershipSummary']);
            Route::get('/',                   [BranchController::class, 'index']);
            Route::get('/{id}/daily-sales',   [BranchController::class, 'dailySales']);
            Route::get('/{id}/sales-summary', [BranchController::class, 'salesSummary']);
            Route::get('/{id}/analytics',     [BranchController::class, 'analytics']);
        });

        Route::post('/raw-materials/{rawMaterial}/adjust', [RawMaterialController::class, 'adjust']);
        Route::apiResource('raw-materials', RawMaterialController::class)->except(['index', 'show']);

        Route::get  ('/recipes/by-menu-item/{menuItemId}', [RecipeController::class, 'byMenuItem']);
        Route::patch('/recipes/{recipe}/toggle',           [RecipeController::class, 'toggle']);
        Route::apiResource('recipes', RecipeController::class)->except(['index', 'show']);
    });

    // ── SUPERADMIN ONLY ───────────────────────────────────────────────────────
    Route::middleware(['role:superadmin'])->group(function () {

        Route::get('/audit-logs',       [AuditLogController::class, 'index']);
        Route::get('/audit-logs/stats', [AuditLogController::class, 'stats']);

        Route::prefix('reports')->group(function () {
            Route::get('/admin-sales-summary', [SuperAdminReportController::class, 'salesSummary']);
            Route::get('/branch-comparison',   [SuperAdminReportController::class, 'branchComparison']);
            Route::get('/z-reading/history',   [SalesDashboardController::class,   'zReadingHistory']);
        });

        Route::prefix('system')->group(function () {
            Route::get ('/audit',             [SettingsController::class, 'getAuditLogs']);
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
            Route::post  ('/',        [AddOnController::class, 'store']);
            Route::put   ('/{addOn}', [AddOnController::class, 'update']);
            Route::delete('/{addOn}', [AddOnController::class, 'destroy']);
        });

        Route::prefix('admin/cards')->group(function () {
            Route::get ('/pending',                   [CardController::class, 'getPendingApprovals']);
            Route::post('/{id}/approve',              [CardController::class, 'approveCard']);
            Route::post('/{id}/reject',               [CardController::class, 'rejectCard']);
            Route::get ('/users',                     [CardController::class, 'getCardUsers']);
            Route::post('/users/{userId}/log-usage',  [CardController::class, 'logUsage']);
        });
    });

    // ── POS DEVICES — superadmin, branch_manager, team_leader ────────────────
    Route::middleware(['role:superadmin,branch_manager,team_leader'])->prefix('pos-devices')->group(function () {
        Route::get   ('/',              [PosDeviceController::class, 'index']);
        Route::post  ('/',              [PosDeviceController::class, 'register']);
        Route::patch ('/{id}/assign',   [PosDeviceController::class, 'assignUser']);
        Route::delete('/{id}/unassign', [PosDeviceController::class, 'unassignUser']);
        Route::patch ('/{id}/toggle',   [PosDeviceController::class, 'toggleStatus']);
        Route::delete('/{id}',          [PosDeviceController::class, 'destroy']);
    });
});