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

            $handle = fopen($path, 'w+');
            fwrite($handle, "-- Backup created on " . date('Y-m-d H:i:s') . "\n\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

            // Get all tables
            $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');

            foreach ($tables as $tableRow) {
                $properties = get_object_vars($tableRow);
                $tableName = reset($properties);

                // Get Create Table Schema
                $createTableResult = \Illuminate\Support\Facades\DB::select("SHOW CREATE TABLE `{$tableName}`");
                $createRow = (array) $createTableResult[0];
                $createSql = $createRow['Create Table'] ?? '';
                
                if (empty($createSql)) continue; // skip views or errors

                fwrite($handle, "DROP TABLE IF EXISTS `{$tableName}`;\n");
                fwrite($handle, "{$createSql};\n\n");

                // Get Table Rows
                $rows = \Illuminate\Support\Facades\DB::table($tableName)->get();
                if ($rows->count() > 0) {
                    foreach ($rows as $row) {
                        $rowArray = (array) $row;
                        $keys = array_keys($rowArray);
                        $values = array_values($rowArray);
                        
                        $escapedValues = array_map(function($val) {
                            if (is_null($val)) return 'NULL';
                            // Safe database escaping for pure PHP
                            $val = str_replace(
                                ['\\', "'", "\r", "\n"], 
                                ['\\\\', "''", '\r', '\n'], 
                                $val
                            );
                            return "'" . $val . "'";
                        }, $values);

                        $sql = "INSERT INTO `{$tableName}` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                        fwrite($handle, $sql);
                    }
                    fwrite($handle, "\n");
                }
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
            fclose($handle);

            return response()->json([
                'success'  => true,
                'message'  => 'Backup created successfully via PHP Native Dumper',
                'filename' => $filename
            ]);

        } catch (\Throwable $e) {
            \Log::error("Backup Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Backup failed natively.',
                'details' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}