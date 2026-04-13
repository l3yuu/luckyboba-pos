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
    public function index(Request $request)
    {
        $settings = Setting::pluck('value', 'key');
        
        $branchId = $request->query('branch_id');
        if ($branchId) {
            $branch = \App\Models\Branch::find($branchId);
            if ($branch) {
                // Override or add branch-specific payment settings
                $settings['gcash_qr_url'] = $branch->gcash_qr ? url('storage/' . $branch->gcash_qr) : ($settings['gcash_qr_url'] ?? null);
                $settings['maya_qr_url']  = $branch->maya_qr ? url('storage/' . $branch->maya_qr) : ($settings['maya_qr_url'] ?? null);
                $settings['gcash_number'] = $branch->gcash_number ?: ($settings['gcash_number'] ?? '');
                $settings['maya_number']  = $branch->maya_number ?: ($settings['maya_number'] ?? '');
                $settings['gcash_name']   = $branch->gcash_name ?: ($settings['gcash_name'] ?? '');
                $settings['maya_name']    = $branch->maya_name ?: ($settings['maya_name'] ?? '');
                $settings['account_name'] = $branch->owner_name ?: $branch->name;
            }
        }

        return response()->json($settings);
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
public function getAuditLogs(Request $request)
{
    try {
        /** @var \App\Models\User $user */
        $user = $request->user();

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

    /**
     * Clear all system audit logs
     */
    public function clearAuditLogs(Request $request)
    {
        try {
            \App\Models\AuditLog::truncate();
            
            \App\Models\AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'Cleared all audit logs',
                'module' => 'Settings',
                'details' => 'Superadmin cleared the entire system audit log history.',
                'ip_address' => $request->ip()
            ]);

            return response()->json(['message' => 'Audit logs cleared successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to clear audit logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reset System Settings & Factory Reset Transactions
     */
    public function resetSystem(Request $request)
    {
        try {
            // Disable foreign key checks so we can truncate safely
            \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();

            // 1. TRUNCATE ALL TRANSACTIONAL DATA (Sales, Cash, Receipts, Stock Logs)
            \App\Models\Sale::truncate();
            \App\Models\SaleItem::truncate();
            \App\Models\CashCount::truncate();
            \App\Models\CashTransaction::truncate();
            \App\Models\Expense::truncate();
            \App\Models\Receipt::truncate();
            \App\Models\ZReading::truncate();
            \App\Models\VoidRequest::truncate();
            \App\Models\PurchaseOrder::truncate();
            \App\Models\PurchaseOrderItem::truncate();
            \App\Models\StockTransfer::truncate();
            \App\Models\StockTransferItem::truncate();
            \App\Models\StockTransaction::truncate();
            \App\Models\StockMovement::truncate();
            \App\Models\StockDeduction::truncate();
            \App\Models\RawMaterialLog::truncate();
            if (class_exists(\App\Models\CardUsageLog::class)) \App\Models\CardUsageLog::truncate();
            if (class_exists(\App\Models\PerkUsage::class)) \App\Models\PerkUsage::truncate();

            // 2. RESET SETTINGS
            Setting::truncate();
            $defaults = [
                'business_name' => 'Lucky Boba',
                'contact_email' => 'admin@luckyboba.com',
                'contact_phone' => '+63 912 345 6789',
                'address' => 'Cebu City, Philippines',
                'vat_rate' => '12%',
                'receipt_footer' => 'Thank you for visiting Lucky Boba!',
                'currency' => 'PHP – Philippine Peso',
                'notifications' => 'true',
                'auto_reports' => 'true',
                'two_factor' => 'false'
            ];

            foreach ($defaults as $key => $value) {
                Setting::create(['key' => $key, 'value' => $value]);
            }

            // 3. WIPE AUDIT LOGS AND INSERT FACTORY RESET EVENT
            \App\Models\AuditLog::truncate();
            \App\Models\AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'Factory Reset System',
                'module' => 'Settings',
                'details' => 'Superadmin performed a complete system factory reset. All transactional data wiped.',
                'ip_address' => $request->ip()
            ]);

            \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

            return response()->json(['message' => 'System successfully reset to factory defaults.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();
            return response()->json(['error' => 'Failed to reset system: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get System Info (Version, DB Status, Uptime, Last Backup)
     */
    public function getSystemInfo()
    {
        try {
            $dbStatus = \Illuminate\Support\Facades\DB::connection()->getPdo() ? 'Connected' : 'Disconnected';
        } catch (\Exception $e) {
            $dbStatus = 'Disconnected';
        }

        $backupDir = storage_path('app/backups');
        $lastBackupStr = 'Never';

        if (file_exists($backupDir)) {
            $files = glob($backupDir . '/*.sql');
            if (!empty($files)) {
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                $lastBackupStr = \Carbon\Carbon::createFromTimestamp(filemtime($files[0]))
                    ->timezone('Asia/Manila')
                    ->format('M d, Y h:i A');
            }
        }

        return response()->json([
            'version' => 'v2.6.0',
            'db_status' => $dbStatus,
            'uptime' => 'Online', // Calculating OS server uptime in PHP isn't universally portable
            'last_backup' => $lastBackupStr
        ]);
    }
}