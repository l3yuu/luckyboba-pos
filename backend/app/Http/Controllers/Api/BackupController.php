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

            // Make path configurable via .env for production flexibility
            $mysqldumpPath = env('DB_DUMP_PATH', 'mysqldump'); 

            $passwordPart = env('DB_PASSWORD') ? '--password="' . env('DB_PASSWORD') . '"' : '';

            // Use escaped quotes for the path and filename to handle spaces in Windows or Linux
            $command = sprintf(
                '"%s" --user=%s %s --host=%s %s > "%s"',
                $mysqldumpPath,
                env('DB_USERNAME'),
                $passwordPart,
                env('DB_HOST'),
                env('DB_DATABASE'),
                $path
            );

            // Execute the command and capture both output and errors
            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);

            if ($returnVar !== 0 || !file_exists($path) || filesize($path) === 0) {
                $errorMsg = implode("\n", $output);
                throw new \Exception("Database export failed (Code: $returnVar): " . $errorMsg);
            }

            return response()->download($path);

        } catch (\Exception $e) {
            \Log::error("Backup Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Backup failed. Please check if mysqldump is installed and the path is correct in .env.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

}