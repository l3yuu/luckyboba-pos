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

    public function listBackups()
    {
        $backupDir = storage_path('app/backups');
        if (!file_exists($backupDir)) return response()->json([]);

        $files = glob($backupDir . '/*.sql');
        $backups = [];

        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size'     => round(filesize($file) / 1024 / 1024, 2) . ' MB',
                'date'     => Carbon::createFromTimestamp(filemtime($file))
                                ->timezone('Asia/Manila')
                                ->format('Y-m-d h:i A'),
                'timestamp'=> filemtime($file)
            ];
        }

        usort($backups, fn($a, $b) => $b['timestamp'] - $a['timestamp']);

        return response()->json($backups);
    }

    public function downloadBackup($filename)
    {
        $path = storage_path("app/backups/{$filename}");
        if (!file_exists($path)) return response()->json(['error' => 'File not found'], 404);

        return response()->download($path);
    }

    public function deleteBackup($filename)
    {
        $path = storage_path("app/backups/{$filename}");
        if (!file_exists($path)) return response()->json(['error' => 'File not found'], 404);

        unlink($path);
        return response()->json(['success' => true]);
    }

    public function runBackup(Request $request)
    {
        try {
            $filename = "lucky_boba_backup_" . now()->format('Y-m-d_His') . ".sql";
            $path = storage_path("app/backups/{$filename}");

            if (!file_exists(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }

            $mysqldumpPath = env('DB_DUMP_PATH', 'mysqldump'); 
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

            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);

            if ($returnVar !== 0 || !file_exists($path) || filesize($path) === 0) {
                $errorMsg = implode("\n", $output);
                throw new \Exception("Database export failed (Code: $returnVar): " . $errorMsg);
            }

            return response()->json([
                'success'  => true,
                'message'  => 'Backup created successfully',
                'filename' => $filename
            ]);

        } catch (\Throwable $e) {
            \Log::error("Backup Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Backup failed. Please check if mysqldump is installed, exec() is enabled, or the properties in .env are correct.',
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}