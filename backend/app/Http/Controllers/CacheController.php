<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\GlobalCacheService;
use Illuminate\Http\JsonResponse;

/**
 * CacheController
 *
 * Single bulk endpoint so React loads everything in ONE request.
 *
 * Add to routes/api.php inside the auth:sanctum group:
 *
 *   use App\Http\Controllers\Api\CacheController;
 *
 *   Route::get('/cache/all',             [CacheController::class, 'all']);
 *   Route::post('/cache/reload/{table}', [CacheController::class, 'reload']);
 *   Route::get('/cache/stats',           [CacheController::class, 'stats']);
 */
class CacheController extends Controller
{
    public function __construct(private GlobalCacheService $cache) {}

    /**
     * GET /api/cache/all
     *
     * Returns every cacheable table in one JSON payload.
     * React calls this once on boot — no more per-table fetches.
     *
     * Mapped to your existing route controllers:
     *   branches, categories, sub_categories → apiResource routes
     *   menu_items                           → /menu
     *   discounts, vouchers, expenses        → apiResource routes
     *   sales, sale_items, receipts          → /sales routes
     *   cash_transactions, cash_counts       → /cash-* routes
     *   purchase_orders, item_serials        → prefix routes
     *   stock_transactions                   → /inventory/history
     *   users                                → /users
     *   settings                             → /settings
     *   z_readings, audit_logs               → /system/audit
     */
    public function all(): JsonResponse
    {
        return response()->json([
            // Catalog
            'branches'           => $this->cache->all('branches'),
            'categories'         => $this->cache->all('categories'),
            'sub_categories'     => $this->cache->all('sub_categories'),
            'menu_items'         => $this->cache->all('menu_items'),
            'discounts'          => $this->cache->all('discounts'),
            'vouchers'           => $this->cache->all('vouchers'),

            // Sales & POS
            'sales'              => $this->cache->all('sales'),
            'sale_items'         => $this->cache->all('sale_items'),
            'receipts'           => $this->cache->all('receipts'),

            // Cash & EOD
            'cash_transactions'  => $this->cache->all('cash_transactions'),
            'cash_counts'        => $this->cache->all('cash_counts'),

            // Inventory & Procurement
            'purchase_orders'    => $this->cache->all('purchase_orders'),
            'stock_transactions' => $this->cache->all('stock_transactions'),
            'item_serials'       => $this->cache->all('item_serials'),

            // Expenses
            'expenses'           => $this->cache->all('expenses'),

            // System
            'users'              => $this->cache->all('users'),
            'settings'           => $this->cache->all('settings'),
            'z_readings'         => $this->cache->all('z_readings'),
            'audit_logs'         => $this->cache->all('audit_logs'),
        ]);
    }

    /**
     * POST /api/cache/reload/{table}
     *
     * Force-reloads one table from DB into cache.
     * Call this after bulk imports or external DB changes.
     */
    public function reload(string $table): JsonResponse
    {
        $allowed = [
            'branches', 'categories', 'sub_categories', 'menu_items',
            'discounts', 'vouchers', 'sales', 'sale_items', 'receipts',
            'cash_transactions', 'cash_counts', 'purchase_orders',
            'stock_transactions', 'item_serials', 'expenses',
            'users', 'settings', 'z_readings', 'audit_logs',
        ];

        if (!in_array($table, $allowed, true)) {
            return response()->json(['error' => "Table '{$table}' is not cacheable."], 422);
        }

        $this->cache->reloadTable($table);

        return response()->json([
            'message' => "Table '{$table}' reloaded.",
            'rows'    => count($this->cache->all($table)),
        ]);
    }

    /**
     * GET /api/cache/stats
     * Useful for debugging and monitoring cache health.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->cache->stats());
    }
}