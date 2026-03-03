<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BackupController extends Controller
{
    public function lastBackupStatus()
    {
        $backupDir = storage_path('app/backups');
        
        // Ensure directory exists so we don't get errors
        if (!file_exists($backupDir)) {
            return response()->json(['last_backup' => 'Never']);
        }

        // Use glob to find all .sql files in that directory
        $files = glob($backupDir . '/*.sql');

        if (empty($files)) {
            return response()->json(['last_backup' => 'Never']);
        }

        // Sort by file modification time to get the absolute latest
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        $lastFile = $files[0];
        $lastBackupTimestamp = filemtime($lastFile);
        
        return response()->json([
            'last_backup' => Carbon::createFromTimestamp($lastBackupTimestamp)
                ->timezone('Asia/Manila')
                ->format('F d, Y')
        ]);
    }

    public function runBackup(Request $request)
    {
        try {
            $filename = "lucky_boba_backup_" . now()->format('Y-m-d_His') . ".sql";
            $path = storage_path("app/backups/{$filename}");

            if (!file_exists(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }

            // Path verified from your screenshot
            $mysqldumpPath = "C:\\Program Files\\MariaDB 12.1\\bin\\mysqldump.exe"; 

            $passwordPart = env('DB_PASSWORD') ? '--password="' . env('DB_PASSWORD') . '"' : '';

            $command = sprintf(
                '"%s" --user=%s %s --host=%s %s > "%s"',
                $mysqldumpPath,
                env('DB_USERNAME'),
                $passwordPart,
                env('DB_HOST'),
                env('DB_DATABASE'),
                $path
            );

            $output = shell_exec($command . ' 2>&1'); 

            if (!file_exists($path) || filesize($path) === 0) {
                throw new \Exception("Database export failed: " . $output);
            }

            return response()->download($path);

        } catch (\Exception $e) {
            \Log::error("Backup Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}