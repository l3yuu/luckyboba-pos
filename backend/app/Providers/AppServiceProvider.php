<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Observers\UniversalObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

// Import every model you want auto-audited
use App\Models\Sale;
use App\Models\Branch;
use App\Models\User;
use App\Models\Discount;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Expense;
use App\Models\CashTransaction;
use App\Models\ZReading;
use App\Models\PurchaseOrder;

// Add more imports as needed:
// use App\Models\Voucher;
// use App\Models\Receipt;
// use App\Models\SubCategory;
// use App\Models\InventoryItem;
// use App\Models\CashCount;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // ── Auto-audit these models on create / update / delete ──────────────
        $models = [
            Sale::class,
            Branch::class,
            User::class,
            Discount::class,
            MenuItem::class,
            Category::class,
            Expense::class,
            CashTransaction::class,
            ZReading::class,
            PurchaseOrder::class,
        ];

        // Only register if the model class actually exists (safe for partial installs)
        foreach ($models as $model) {
            if (class_exists($model)) {
                $model::observe(UniversalObserver::class);
            }
        }

        // Add these once you confirm the models exist in your project:
        // if (class_exists(StockTransfer::class))  StockTransfer::observe(UniversalObserver::class);
        // if (class_exists(Supplier::class))       Supplier::observe(UniversalObserver::class);
        // if (class_exists(\App\Models\Voucher::class)) \App\Models\Voucher::observe(UniversalObserver::class);

        // ── Rate Limiters ───────────────────────────────────────────────────
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('kiosk', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}