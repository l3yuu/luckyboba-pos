<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * UniversalObserver
 *
 * Attach this to any Eloquent model to automatically log
 * created / updated / deleted events to the audit_logs table.
 *
 * Register in AppServiceProvider::boot():
 *   Sale::observe(UniversalObserver::class);
 *   Order::observe(UniversalObserver::class);
 *   etc.
 */
class UniversalObserver
{
    // Map model class → human-readable module name
    private static array $moduleMap = [
        'Sale'             => 'Sales',
        'SaleItem'         => 'Sales',
        'Order'            => 'Orders',
        'Branch'           => 'Branches',
        'User'             => 'Users',
        'Discount'         => 'Discounts',
        'Voucher'          => 'Vouchers',
        'MenuItem'         => 'Menu',
        'Category'         => 'Menu',
        'SubCategory'      => 'Menu',
        'InventoryItem'    => 'Inventory',
        'PurchaseOrder'    => 'Inventory',
        'StockTransfer'    => 'Inventory',
        'StockTransaction' => 'Inventory',
        'Expense'          => 'Expenses',
        'CashTransaction'  => 'Cash',
        'CashCount'        => 'Cash',
        'ZReading'         => 'Reports',
        'XReading'         => 'Reports',
        'Receipt'          => 'Sales',
        'Setting'          => 'Settings',
        'Supplier'         => 'Inventory',
    ];

    // Fields to include in "details" summary (model-specific)
    private static array $summaryFields = [
        'Sale'          => ['total', 'status', 'branch_id'],
        'Order'         => ['total', 'status'],
        'Discount'      => ['name', 'amount', 'type', 'status'],
        'Voucher'       => ['code', 'amount', 'status'],
        'Branch'        => ['name', 'location', 'status'],
        'User'          => ['name', 'email', 'role'],
        'MenuItem'      => ['name', 'price', 'is_active'],
        'PurchaseOrder' => ['status', 'total_amount'],
        'Expense'       => ['amount', 'description'],
        'CashTransaction'=> ['amount', 'type'],
        'ZReading'      => ['branch_id', 'total_sales'],
    ];

    public function created(Model $model): void
    {
        $this->log('created', $model);
    }

    public function updated(Model $model): void
    {
        // Only log if meaningful fields changed (ignore timestamps)
        $dirty = collect($model->getDirty())
            ->except(['updated_at', 'created_at', 'remember_token'])
            ->keys()
            ->implode(', ');

        if (empty($dirty)) return;

        $this->log('updated', $model, "Changed: {$dirty}");
    }

    public function deleted(Model $model): void
    {
        $this->log('deleted', $model);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function log(string $event, Model $model, ?string $extra = null): void
    {
        try {
            $class   = class_basename($model);
            $module  = self::$moduleMap[$class] ?? $class;
            $label   = $this->label($model, $class);
            $details = $this->details($model, $class, $extra);

            AuditLog::create([
                'user_id'    => Auth::id(),
                'action'     => ucfirst($event) . " {$class}: {$label}",
                'module'     => $module,
                'details'    => $details,
                'ip_address' => request()->ip(),
            ]);
        } catch (\Throwable) {
            // Never break the main request
        }
    }

    private function label(Model $model, string $class): string
    {
        // Try common name fields in order
        foreach (['name', 'code', 'title', 'description', 'email'] as $field) {
            if (!empty($model->$field)) {
                return "#{$model->id} ({$model->$field})";
            }
        }
        return "#{$model->id}";
    }

    private function details(Model $model, string $class, ?string $extra): ?string
    {
        $fields  = self::$summaryFields[$class] ?? [];
        $summary = collect($fields)
            ->filter(fn($f) => isset($model->$f))
            ->map(fn($f) => "{$f}: {$model->$f}")
            ->implode(' | ');

        return collect([$summary, $extra])->filter()->implode(' — ') ?: null;
    }
}