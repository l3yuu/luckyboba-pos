<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\AuditLog; // Ensure you created this model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    /**
     * Get all system settings
     */
    public function index()
    {
        // Returns: { "tax_rate": "12", "service_charge": "5" }
        return response()->json(Setting::pluck('value', 'key'));
    }

    /**
     * Update multiple settings and log the action
     */
    public function update(Request $request)
    {
        try {
            foreach ($request->all() as $key => $value) {
                Setting::updateOrCreate(['key' => $key], ['value' => $value]);
            }

            // Record this in the Audit Log
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'Updated System Settings',
                'module' => 'Settings',
                'details' => 'Modified system configuration: ' . implode(', ', array_keys($request->all())),
                'ip_address' => $request->ip()
            ]);

            return response()->json(['message' => 'Settings saved successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Fetch System Audit Logs (Fixes the 404 error in Settings.tsx)
     */
    public function getAuditLogs()
    {
        try {
            // Fetch the last 50 actions with the name of the user who did them
            $logs = AuditLog::with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function($log) {
                    return [
                        'id' => $log->id,
                        'user' => $log->user->name ?? 'System',
                        'action' => $log->action,
                        'module' => $log->module,
                        'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}