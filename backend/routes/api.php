<?php

use App\Http\Controllers\Api\{ BackupController, BranchSettingsController, CashCountController, CashTransactionController, CategoryController, CustomerController, DashboardController, DiscountController, ExpenseController, InventoryController, StockTransferController, InventoryDashboardController, InventoryReportController, ItemSerialController, MenuController, MenuListController, PurchaseOrderController, ReceiptController, ReportController, SalesController, SalesDashboardController, SearchController, SettingsController, SubCategoryController, UploadController, VoucherController, BranchController, AddOnController, SuperAdminReportController, CardPurchaseController, MenuItemController, SupplierController, ItemCheckerController, PulseController, StaffPerformanceController, InventoryAlertController, FeaturedDrinkController, FavoriteController, ReviewController, FranchiseController };
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
use App\Http\Controllers\Api\MenuItemAddonController;
use App\Http\Controllers\Api\RecipeController;
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

Route::post('/login',  [AuthController::class, 'login'])->middleware('throttle:5,2');
Route::post('/verify-2fa', [AuthController::class, 'verify2FA'])->middleware('throttle:5,2');
Route::post('/resend-2fa', [AuthController::class, 'resend2FA'])->middleware('throttle:5,2');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ── DEVICE CHECK — public, no auth, called before login ──────────────────────
Route::post('/devices/check', [PosDeviceController::class, 'check'])->middleware('throttle:10,1');
// ─────────────────────────────────────────────────────────────────────────────

Route::post('/purchase-card',             [CardPurchaseController::class, 'purchase'])->middleware('throttle:30,1');
Route::get('/check-card-status/{userId}', [CardPurchaseController::class, 'checkStatus'])->middleware('throttle:30,1');

// ✅ PUBLIC MOBILE ROUTES
Route::post('/kiosk-sales', [SalesController::class, 'store']); // Allow kiosk orders without auth
Route::get('/cards',            [CardController::class, 'index'])->middleware('throttle:60,1');
Route::get('/cards/image/{path}', [CardController::class, 'image'])
    ->where('path', '.*')
    ->middleware('throttle:120,1');
Route::get('/payment-settings', [SettingsController::class, 'index'])->middleware('throttle:60,1');
Route::get('/add-ons',          [AddOnController::class, 'index'])->middleware('throttle:60,1');
Route::get('/addons',           [AddOnController::class, 'index'])->middleware('throttle:60,1');
Route::get('/featured-drinks',  [FeaturedDrinkController::class, 'publicIndex'])->middleware('throttle:60,1');
Route::get('/sugar-levels',     [SugarLevelController::class, 'index'])->middleware('throttle:60,1');
Route::get('/bundles',          [BundleController::class, 'index'])->middleware('throttle:60,1');
Route::get('/receipts/next-sequence', [ReceiptController::class, 'getNextSequence']);


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
            'categories.category_type',
            'categories.id as category_id',
            'menu_items.price as sellingPrice',
            'menu_items.image',
            'menu_items.size'
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
})->middleware('throttle:30,1');
// ─────────────────────────────────────────────────────────────────────────────

Route::post('/kiosk/verify-pin', function (Illuminate\Http\Request $request) {
    $request->validate([
        'pin' => 'required|string'
    ]);
    $pin = $request->input('pin');
    $branchId = $request->input('branch_id'); // Optional if kiosk is unbound

    // Check Global SuperAdmin PIN
    $globalPin = \App\Models\Setting::where('key', 'global_kiosk_pin')->value('value') ?? '1234';
    if ($pin === $globalPin) {
        return response()->json(['success' => true]);
    }

    // Check Branch PIN if a branch is specified
    if ($branchId) {
        $branch = \App\Models\Branch::find($branchId);
        if ($branch) {
            $branchPin = $branch->kiosk_pin ?? '1234';
            if ($pin === $branchPin) {
                return response()->json(['success' => true]);
            }
        }
    }

    return response()->json(['success' => false, 'message' => 'Invalid PIN'], 403);
})->middleware('throttle:30,1');

Route::get('/branches/available', [BranchController::class, 'availableBranches']);
Route::post('/google-login', [AuthController::class, 'googleLogin'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register']);
// ── Z Reading print — public, auth handled via one-time cache token ───────────
Route::get('/readings/z/print', [SalesDashboardController::class, 'zReadingPrint']);
// ── Authenticated routes ─────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    Route::post('/online-orders', [OnlineOrderController::class, 'store']);
    Route::post('/cards/generate-qr',  [CardController::class, 'generateQr']);
    Route::get('/cards/perk-status',   [CardController::class, 'perkStatus']);
    Route::get('/my-orders',      [OnlineOrderController::class, 'myOrders']);
    Route::get('/orders/{id}/reorder', [OnlineOrderController::class, 'reorder']);
    Route::get('/points', [PointsController::class, 'index']);
    Route::post('/points/redeem', [PointsController::class, 'redeem']);

    // ── LOYALTY (Mobile & Shared) ──────────────────────────────────────────
    Route::get('/loyalty/rewards', [LoyaltyManagementController::class, 'getRewards']);
    Route::get('/vouchers/available', [VoucherController::class, 'available']);
    Route::get('/vouchers/validate', [VoucherController::class, 'validateCode']);

    // ── FAVORITES ────────────────────────────────────────────────────────
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{menuItemId}', [FavoriteController::class, 'destroy']);

    // ── REVIEWS ──────────────────────────────────────────────────────────
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/branches/{branchId}/reviews', [ReviewController::class, 'branchReviews']);

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
        $user = $request->user();
        $user->load('branch'); // Load full branch relation
        return $user;
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
        Route::apiResource('suppliers', SupplierController::class)->only(['index', 'store', 'update', 'destroy']);


        Route::get   ('/online-orders',            [OnlineOrderController::class, 'index']);
        Route::patch ('/online-orders/{id}/status',[OnlineOrderController::class, 'updateStatus']);
        Route::get   ('/online-orders/stats',      [OnlineOrderController::class, 'stats']);

        // ── Branch Manager App Routes ─────────────────────────────────────────
        Route::get   ('branch/app-orders',              [BranchManagerAppController::class, 'appOrders']);
        Route::patch ('branch/app-orders/{id}/status',  [BranchManagerAppController::class, 'updateStatus']);
        Route::get   ('branch/menu-items',              [BranchManagerAppController::class, 'menuItems']);
        Route::post  ('branch/menu-items/{id}/toggle',  [BranchManagerAppController::class, 'toggleMenuItem']);
        
        Route::get   ('branch/payment-settings',       [BranchSettingsController::class, 'getPaymentSettings']);
        Route::post  ('branch/payment-settings',       [BranchSettingsController::class, 'updatePaymentSettings']);
        // ─────────────────────────────────────────────────────────────────────

        Route::get('/dashboard/stats', [DashboardController::class, 'index']);
        Route::get('/app-init',        [DashboardController::class, 'init']);
        Route::get('/sales-analytics', [SalesDashboardController::class, 'index']);

        // ── Dashboard & POS Read Endpoints ────────────────────────────────────
        Route::get('/cash-counts/status',      [CashCountController::class, 'checkEodStatus']);
        Route::post('/cash-counts',            [CashCountController::class, 'store']);
        Route::post('/cash-in',                [CashCountController::class, 'storeCashIn']);
        Route::get('/cash-transactions/status',[CashCountController::class, 'checkInitialCash']);
        
        Route::get('/payment-settings',        [SettingsController::class, 'index']);
        // ── Branch read routes (specfic routes must come before {id}) ──────────────
        Route::get('/branches/ownership-summary', [BranchController::class, 'ownershipSummary']);
        Route::get('/branches/performance',       [BranchController::class, 'performance']);
        Route::get('/branches/today-sales',       [BranchController::class, 'todaySales']);
        
        Route::get('/branches/{id}',           [BranchController::class, 'show']);
        Route::get('/branches/{id}/details',   [BranchController::class, 'show']);
        Route::get('/branches/{id}/payment-settings', [BranchSettingsController::class, 'getPaymentSettings']);
        
        Route::get('/menu',                    [MenuController::class, 'index']);
        Route::get('/notifications/summary',   [NotificationController::class, 'summary']);

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
        Route::get  ('/menu/version',          [MenuController::class,        'version']);
        Route::post ('/menu/clear-cache',      [MenuController::class,        'clearCache']);
        Route::get  ('/notifications/summary', [NotificationController::class,'summary']);
        Route::post ('/audit-logs',            [AuditLogController::class,    'store']);

        Route::apiResource('menu-list',  MenuListController::class)->only(['index', 'store']);
        Route::get ('/menu-items/export',           [MenuItemController::class, 'export']);
        Route::get ('/menu-items/import-template', [MenuItemController::class, 'downloadTemplate']);
        Route::post('/menu-items/import',          [MenuItemController::class, 'import']);
        Route::apiResource('menu-items', MenuItemController::class);

        Route::get ('/menu-item-options',       [MenuItemOptionController::class, 'index']);
        Route::get ('/menu-item-options/bulk',  [MenuItemOptionController::class, 'bulk']);
        Route::put ('/menu-item-options/{id}',  [MenuItemOptionController::class, 'update']);
        
        Route::get ('/menu-item-addons',       [MenuItemAddonController::class, 'index']);
        Route::put ('/menu-item-addons/{id}',  [MenuItemAddonController::class, 'update']);

        Route::get('/bundles',         [BundleController::class,       'index']);
        Route::get('/category-drinks', [CategoryDrinkController::class,'index']);

        Route::apiResource('categories',     CategoryController::class);
        Route::apiResource('sub-categories', SubCategoryController::class);
        Route::get('/sub-categories/filter/{categoryId}', [SubCategoryController::class, 'getByCategory']);

        Route::get('/cups',                                      [CupController::class,       'index']);
        Route::get('/sugar-levels/by-item/{menuItemId}',         [SugarLevelController::class,'byMenuItem']);
        Route::get('/menu-item-sugar-levels',                    [SugarLevelController::class,'byMenuItemViaQuery']); // Added to match frontend
        Route::put('/menu-item-sugar-levels/{id}',               [SugarLevelController::class,'updateAssignment']);   // Added to match frontend

        Route::prefix('inventory')->group(function () {
            Route::get('/',             [InventoryController::class,          'index']);
            Route::get('/top-products', [InventoryDashboardController::class, 'getWeeklyTopProducts']);
            Route::get('/history',      [InventoryController::class,          'getTransactionHistory']);
            
            // Usage Report (Read Access for all roles)
            Route::get('/usage-report',           [InventoryController::class, 'usageReport']);
            Route::get('/usage-report/get-product-sales', [InventoryController::class, 'productSalesSummary']);
            Route::get('/usage-report/breakdown/{id}', [InventoryController::class, 'usageBreakdown']);
            Route::get('/usage-report/export',    [InventoryController::class, 'exportUsageReport']);
        });

        Route::get('/raw-materials/low-stock',             [RawMaterialController::class, 'lowStock']);
        Route::get('/raw-materials/movements',             [RawMaterialController::class, 'movements']);
        Route::get('/raw-materials/{rawMaterial}/history', [RawMaterialController::class, 'history']);
        
        // Bulk Audit (Log physical counts)
        Route::post('/raw-materials/bulk-audit',           [RawMaterialController::class, 'bulkAudit']);
        Route::post('/raw-materials/{rawMaterial}/adjust', [RawMaterialController::class, 'adjust']);
        
        Route::apiResource('raw-materials', RawMaterialController::class)->only(['index', 'show']);

        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('/item-serials',    [ItemSerialController::class,    'index']);

        Route::get ('/recipes',  [RecipeController::class, 'index']);
        Route::get ('/expenses',        [ExpenseController::class,'index']);
        Route::post('/expenses',        [ExpenseController::class,'store']);
        Route::post('/expenses/{id}/mark-as-paid', [ExpenseController::class,'markAsPaid']);
        Route::get ('/expenses/export', [ExpenseController::class,'export']);
        Route::put ('/expenses/{id}',   [ExpenseController::class,'update']);
        Route::delete('/expenses/{id}', [ExpenseController::class,'destroy']);

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
            Route::get('/z-reading/status',  [SalesDashboardController::class,  'zReadingStatus']);
            Route::get('/z-reading/gaps',    [SalesDashboardController::class,  'zReadingGaps']);
            Route::get('/z-reading/history', [SalesDashboardController::class,  'zReadingHistory']);
            Route::get('/z-reading',         [SalesDashboardController::class,  'zReading']);
            Route::get('/pulse',             [PulseController::class,           'index']);
            Route::get('/staff-performance', [StaffPerformanceController::class, 'index']);
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


        Route::get ('/branches', [BranchController::class, 'index']);

        Route::prefix('stock-transfers')->group(function () {
            Route::get ('/',                            [StockTransferController::class, 'index']);
            Route::post('/',                            [StockTransferController::class, 'store']);
            Route::post('/{stockTransfer}/approve',     [StockTransferController::class, 'approve']);
            Route::post('/{stockTransfer}/in-transit',  [StockTransferController::class, 'inTransit']);
            Route::post('/{stockTransfer}/receive',     [StockTransferController::class, 'receive']);
            Route::post('/{stockTransfer}/cancel',      [StockTransferController::class, 'cancel']);
        });

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
        });

        Route::prefix('purchase-orders')->group(function () {
            Route::post ('/',             [PurchaseOrderController::class, 'store']);
            Route::patch('/{id}/status',  [PurchaseOrderController::class, 'updateStatus']);
            Route::post ('/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
            Route::post ('/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
            Route::post ('/{purchaseOrder}/receive-items', [PurchaseOrderController::class, 'receiveItems']);
            Route::post ('/{purchaseOrder}/cancel',  [PurchaseOrderController::class, 'cancel']);
        });

        Route::prefix('item-serials')->group(function () {
            Route::post ('/',             [ItemSerialController::class, 'store']);
            Route::patch('/{id}/status',  [ItemSerialController::class, 'updateStatus']);
        });

        Route::apiResource('expenses', ExpenseController::class)->only(['store']);

        Route::apiResource('discounts', DiscountController::class)->except(['show', 'update', 'index']);
        Route::patch('/discounts/{discount}/toggle', [DiscountController::class, 'toggleStatus']);
        Route::apiResource('vouchers',  VoucherController::class)->except(['show']);


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
            Route::put   ('/{id}',                [BranchController::class, 'update']);
            Route::delete('/{id}',                [BranchController::class, 'destroy']);
            Route::get   ('/{id}/daily-sales',    [BranchController::class, 'dailySales']);
            Route::get   ('/{id}/analytics',      [BranchController::class, 'analytics']);
            Route::get   ('/{id}/sales-summary',  [BranchController::class, 'salesSummary']);
            Route::post  ('/{id}/refresh-totals', [BranchController::class, 'refreshTotals']);
        });

        // ── CUSTOMER MANAGEMENT (SuperAdmin + BranchManager) ────────────────
        Route::prefix('customers')->group(function () {
            Route::get('/',                    [CustomerController::class, 'index']);
            Route::get('/stats',               [CustomerController::class, 'stats']);
            Route::get('/{id}',                [CustomerController::class, 'show']);
            Route::patch('/{id}/toggle-status', [CustomerController::class, 'toggleStatus']);
        });

        // ── BRANCH PAYMENT SETTINGS ──
        Route::get('/branch/payment-settings', [BranchSettingsController::class, 'getPaymentSettings']);
        Route::post('/branch/payment-settings', [BranchSettingsController::class, 'updatePaymentSettings']);


    });

    // ── SUPERADMIN ONLY ───────────────────────────────────────────────────────
    Route::middleware(['role:superadmin'])->group(function () {
        Route::get('/inventory-alerts', [InventoryAlertController::class, 'index']);

        // ── EXPENSE APPROVALS (SuperAdmin) ──────────────────────────────────
        Route::post('/expenses/{id}/approve', [ExpenseController::class, 'approve']);
        Route::post('/expenses/{id}/reject',  [ExpenseController::class, 'reject']);

        // ── FRANCHISES (SuperAdmin) ──────────────────────────────────────────
        Route::apiResource('/franchises', FranchiseController::class);
        Route::post('/franchises/{id}/assign-branches', [FranchiseController::class, 'assignBranches']);

        // ── CUSTOMER MANAGEMENT (Moved to shared block) ─────────────────────
        
        // Moved from branch_manager block to restrict editing to SuperAdmin only
        Route::apiResource('raw-materials', RawMaterialController::class)->except(['index', 'show']);

        Route::get  ('/recipes/by-menu-item/{menuItemId}', [RecipeController::class, 'byMenuItem']);
        Route::patch('/recipes/{recipe}/toggle',           [RecipeController::class, 'toggle']);
        Route::apiResource('recipes', RecipeController::class)->except(['index', 'show']);

        Route::get('/audit-logs',        [AuditLogController::class, 'index']);
        Route::get('/audit-logs/export', [AuditLogController::class, 'export']);
        Route::get('/audit-logs/stats',  [AuditLogController::class, 'stats']);

        Route::prefix('reports')->group(function () {
            Route::get('/items-all',           [SuperAdminReportController::class, 'itemsReport']);
            Route::get('/items-export',        [SuperAdminReportController::class, 'exportItems']);
        });

        Route::prefix('system')->group(function () {
            Route::get ('/info',              [SettingsController::class, 'getSystemInfo']);
            Route::get ('/audit',             [SettingsController::class, 'getAuditLogs']);
            Route::delete('/audit/clear',     [SettingsController::class, 'clearAuditLogs']);
            Route::post('/reset',             [SettingsController::class, 'resetSystem']);
            Route::get ('/backup-status',     [BackupController::class,   'lastBackupStatus']);
            Route::get ('/backups',           [BackupController::class,   'listBackups']);
            Route::get ('/backups/download/{filename}', [BackupController::class, 'downloadBackup']);
            Route::delete('/backups/{filename}', [BackupController::class, 'deleteBackup']);
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
            Route::get ('/',                          [CardController::class, 'adminIndex']);
            Route::post('/',                          [CardController::class, 'store']);
            Route::post('/{id}',                      [CardController::class, 'update']);
            Route::delete('/{id}',                    [CardController::class, 'destroy']);
            Route::patch('/{id}/toggle',              [CardController::class, 'toggle']);
            
            Route::get ('/pending',                   [CardController::class, 'getPendingApprovals']);
            Route::post('/{id}/approve',              [CardController::class, 'approveCard']);
            Route::post('/{id}/reject',               [CardController::class, 'rejectCard']);
            Route::get ('/users',                     [CardController::class, 'getCardUsers']);
            Route::post('/users/{userId}/log-usage',  [CardController::class, 'logUsage']);
        });

        // ── FEATURED DRINKS (SuperAdmin) ────────────────────────────────────
        Route::prefix('featured-drinks')->group(function () {
            Route::get   ('/',            [FeaturedDrinkController::class, 'index']);
            Route::post  ('/',            [FeaturedDrinkController::class, 'store']);
            Route::post  ('/{id}',        [FeaturedDrinkController::class, 'update']);
            Route::delete('/{id}',        [FeaturedDrinkController::class, 'destroy']);
            Route::patch ('/{id}/toggle', [FeaturedDrinkController::class, 'toggle']);
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

    // ── SUPERADMIN + BRANCH MANAGER — shared report endpoints ────────────────
    Route::middleware(['role:superadmin,branch_manager'])->prefix('reports')->group(function () {
        Route::get('/admin-sales-summary', [SuperAdminReportController::class, 'salesSummary']);
        Route::get('/branch-comparison',   [SuperAdminReportController::class, 'branchComparison']);
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