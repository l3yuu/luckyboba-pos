<?php
// app/Helpers/AuditHelper.php

namespace App\Helpers;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditHelper
{
    public static function log(string $module, string $action, ?string $details = null): void
    {
        try {
            AuditLog::create([
                'user_id'    => Auth::id(),
                'module'     => $module,
                'action'     => $action,
                'details'    => $details,
                'ip_address' => Request::ip(),
            ]);
        } catch (\Throwable) {
            // never break the main flow
        }
    }
}