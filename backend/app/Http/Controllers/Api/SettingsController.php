<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog; // Ensure you created this model
use App\Models\Setting;
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
        // Gets the authenticated Cashier Ichigo user
        $user = auth()->user(); 

        $logs = \App\Models\AuditLog::with('user')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($log) => [
                'id' => $log->id,
                'user' => $log->user->name ?? 'System',
                'action' => $log->action,
                // Formatted for Philippines timezone
                'time' => $log->created_at->timezone('Asia/Manila')->format('h:i A')
            ]);

        return response()->json([
            'active_session' => $user->name, // Dynamic name from database
            'system_status' => 'Online',
            'logs' => $logs
        ]);
    } catch (\Exception $e) {
        \Log::error("Audit Fetch Error: " . $e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
}

    /**
 * Export System Audit Logs to a .txt file
 */
public function exportAuditLogs(): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $logs = \App\Models\AuditLog::with('user')->latest()->get();
    $fileName = 'lucky_boba_audit_log_' . now()->format('Y-m-d') . '.txt';

    $headers = [
        "Content-type"        => "text/plain",
        "Content-Disposition" => "attachment; filename=$fileName",
    ];

    $callback = function() use($logs) {
        $file = fopen('php://output', 'w');
        fwrite($file, "LUCKY BOBA - SYSTEM AUDIT LOG\n");
        fwrite($file, "Generated: " . now()->timezone('Asia/Manila')->format('F d, Y h:i A') . "\n");
        fwrite($file, str_repeat("-", 40) . "\n\n");

        foreach ($logs as $log) {
            $line = sprintf(
                "[%s] USER: %s | ACTION: %s\n",
                $log->created_at->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                $log->user->name,
                $log->action
            );
            fwrite($file, $line);
        }
        fclose($file);
    };

    return response()->stream($callback, 200, $headers);
}
}