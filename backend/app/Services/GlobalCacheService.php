<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * GlobalCacheService for LuckyBoba POS
 *
 * Loads DB tables into Laravel cache on boot.
 * All reads are served from memory — zero extra DB queries.
 *
 * Register in AppServiceProvider:
 *
 *   public function register(): void {
 *       $this->app->singleton(GlobalCacheService::class);
 *   }
 *
 *   public function boot(): void {
 *       app(GlobalCacheService::class)->load();
 *   }
 */
class GlobalCacheService
{
    private const TTL    = null;    // null = cache forever until invalidated
    private const PREFIX = 'lbc_'; // lucky_boba_cache prefix

    /**
     * Tables to cache and their primary keys.
     *
     * Excluded (volatile / security-sensitive / views):
     *   sessions, cache, cache_locks, jobs, job_batches, failed_jobs,
     *   migrations, password_reset_tokens, personal_access_tokens,
     *   branch_performance, daily_sales_by_branch, today_sales_by_branch
     */
    private const TABLES = [
        'branches'           => 'id',
        'categories'         => 'id',
        'sub_categories'     => 'id',
        'menu_items'         => 'id',
        'discounts'          => 'id',
        'vouchers'           => 'id',
        'sales'              => 'id',
        'sale_items'         => 'id',
        'receipts'           => 'id',
        'cash_transactions'  => 'id',
        'cash_counts'        => 'id',
        'purchase_orders'    => 'id',
        'stock_transactions' => 'id',
        'expenses'           => 'id',
        'item_serials'       => 'id',
        'users'              => 'id',
        'settings'           => 'id',
        'z_readings'         => 'id',
        'audit_logs'         => 'id',
    ];

    private bool $loaded = false;

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    public function load(): void
    {
        if ($this->loaded) return;

        foreach (array_keys(self::TABLES) as $table) {
            if (!Cache::has(self::PREFIX . $table)) {
                $this->loadTable($table);
            }
        }

        $this->loaded = true;
    }

    public function reloadTable(string $table): void
    {
        $this->loadTable($table);
    }

    public function reloadAll(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            $this->loadTable($table);
        }
        $this->loaded = true;
    }

    private function loadTable(string $table): void
    {
        $pk   = self::TABLES[$table] ?? 'id';
        $rows = DB::table($table)->get()->keyBy($pk)->toArray();
        Cache::put(self::PREFIX . $table, $rows, self::TTL);
    }

    // ── Generic Read API ──────────────────────────────────────────────────────

    public function all(string $table): array
    {
        return array_values(Cache::get(self::PREFIX . $table, []));
    }

    public function get(string $table, int|string $id): mixed
    {
        return Cache::get(self::PREFIX . $table, [])[$id] ?? null;
    }

    public function find(string $table, callable $predicate): array
    {
        return array_values(array_filter(
            Cache::get(self::PREFIX . $table, []),
            $predicate
        ));
    }

    public function findOne(string $table, callable $predicate): mixed
    {
        foreach (Cache::get(self::PREFIX . $table, []) as $row) {
            if ($predicate($row)) return $row;
        }
        return null;
    }

    // ── Domain Shortcuts ──────────────────────────────────────────────────────

    public function menuItemsByCategory(int $categoryId): array
    {
        return $this->find('menu_items', fn($r) => $r->category_id === $categoryId);
    }

    public function menuItemsBySubCategory(int $subCategoryId): array
    {
        return $this->find('menu_items', fn($r) => $r->sub_category_id === $subCategoryId);
    }

    public function saleItems(int $saleId): array
    {
        return $this->find('sale_items', fn($r) => $r->sale_id === $saleId);
    }

    public function salesByBranch(int $branchId): array
    {
        return $this->find('sales', fn($r) => $r->branch_id === $branchId);
    }

    public function activeDiscounts(): array
    {
        return $this->find('discounts', fn($r) => $r->is_active == 1);
    }

    public function activeVouchers(): array
    {
        return $this->find('vouchers', fn($r) => $r->is_active == 1);
    }

    public function userByEmail(string $email): mixed
    {
        return $this->findOne('users', fn($r) => $r->email === $email);
    }

    public function setting(string $key): mixed
    {
        $row = $this->findOne('settings', fn($r) => $r->key === $key);
        return $row?->value ?? null;
    }

    // ── Write-through API ─────────────────────────────────────────────────────

    public function insert(string $table, array $data): int
    {
        $id  = DB::table($table)->insertGetId($data);
        $pk  = self::TABLES[$table] ?? 'id';

        $cached      = Cache::get(self::PREFIX . $table, []);
        $cached[$id] = (object) array_merge($data, [$pk => $id]);
        Cache::put(self::PREFIX . $table, $cached, self::TTL);

        return $id;
    }

    public function update(string $table, int|string $id, array $data): void
    {
        $pk = self::TABLES[$table] ?? 'id';
        DB::table($table)->where($pk, $id)->update($data);

        $cached = Cache::get(self::PREFIX . $table, []);
        if (isset($cached[$id])) {
            foreach ($data as $k => $v) $cached[$id]->$k = $v;
            Cache::put(self::PREFIX . $table, $cached, self::TTL);
        }
    }

    public function delete(string $table, int|string $id): void
    {
        $pk = self::TABLES[$table] ?? 'id';
        DB::table($table)->where($pk, $id)->delete();

        $cached = Cache::get(self::PREFIX . $table, []);
        unset($cached[$id]);
        Cache::put(self::PREFIX . $table, $cached, self::TTL);
    }

    public function invalidate(string $table, int|string $id): void
    {
        $cached = Cache::get(self::PREFIX . $table, []);
        unset($cached[$id]);
        Cache::put(self::PREFIX . $table, $cached, self::TTL);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public function stats(): array
    {
        return array_map(fn($table) => [
            'table'  => $table,
            'rows'   => count(Cache::get(self::PREFIX . $table, [])),
            'cached' => Cache::has(self::PREFIX . $table),
        ], array_keys(self::TABLES));
    }
}