<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    /**
     * Log an action to the audit trail.
     *
     * Usage (from any controller):
     *   $this->audit('Created sale #123', 'Sales', 'amount: ₱500');
     */
    protected function audit(string $action, string $module, ?string $details = null): void
    {
        try {
            AuditLog::create([
                'user_id'    => Auth::id(),
                'action'     => $action,
                'module'     => $module,
                'details'    => $details,
                'ip_address' => request()->ip(),
            ]);
        } catch (\Throwable) {
            // Never let audit logging break the main request
        }
    }
}