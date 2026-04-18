<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\CashCount;
use App\Models\CashTransaction;
use App\Models\CardUsageLog;
use App\Models\Expense;
use App\Models\PerkUsage;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\RawMaterialLog;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\StockDeduction;
use App\Models\StockMovement;
use App\Models\StockTransaction;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use App\Models\VoidRequest;
use App\Models\ZReading;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

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
            $branch = Branch::find($branchId);
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
        /** @var User $user */
        $user = $request->user();

        $logs = AuditLog::with('user')
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
        Log::error("Audit Fetch Error: " . $e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
}

    /**
 * Export System Audit Logs to a .txt file
 */
public function exportAuditLogs(): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $logs = AuditLog::with('user')->latest()->get();
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
            AuditLog::truncate();
            
            AuditLog::create([
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
            // 0. VERIFY PASSWORD
            $request->validate([
                'password' => 'required|string',
            ]);

            if (!Hash::check($request->password, $request->user()->password)) {
                return response()->json(['error' => 'Invalid password'], 422);
            }

            // Disable foreign key checks so we can truncate safely
            Schema::disableForeignKeyConstraints();
 
            // 1. TRUNCATE ALL TRANSACTIONAL DATA (Sales, Cash, Receipts, Stock Logs)
            Sale::truncate();
            SaleItem::truncate();
            CashCount::truncate();
            CashTransaction::truncate();
            Expense::truncate();
            Receipt::truncate();
            ZReading::truncate();
            VoidRequest::truncate();
            PurchaseOrder::truncate();
            PurchaseOrderItem::truncate();
            StockTransfer::truncate();
            StockTransferItem::truncate();
            StockTransaction::truncate();
            StockMovement::truncate();
            StockDeduction::truncate();
            RawMaterialLog::truncate();
            if (class_exists(CardUsageLog::class)) CardUsageLog::truncate();
            if (class_exists(PerkUsage::class)) PerkUsage::truncate();

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
            AuditLog::truncate();
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'Factory Reset System',
                'module' => 'Settings',
                'details' => 'Superadmin performed a complete system factory reset. All transactional data wiped.',
                'ip_address' => $request->ip()
            ]);

            Schema::enableForeignKeyConstraints();

            return response()->json(['message' => 'System successfully reset to factory defaults.']);
        } catch (\Exception $e) {
            Schema::enableForeignKeyConstraints();
            return response()->json(['error' => 'Failed to reset system: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get System Info (Version, DB Status, Uptime, Last Backup)
     */
    public function getSystemInfo()
    {
        try {
            $dbStatus = DB::connection()->getPdo() ? 'Connected' : 'Disconnected';
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
                $lastBackupStr = Carbon::createFromTimestamp(filemtime($files[0]))
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