<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Imports\DiscountsImport; // Ensure you created this class
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class UploadController extends Controller
{
    public function uploadDiscounts(Request $request)
    {
        // 1. Updated validation to allow Excel formats
        $request->validate([
            'file' => 'required|max:10240', // Remove mimes check temporarily
        ]);

        try {
            // 2. Use the Excel library to handle the heavy lifting
            $import = new DiscountsImport;
            Excel::import($import, $request->file('file'));

            // 3. Log the successful bulk action
            AuditLog::create([
                'user_id' => Auth::id(),
                'action'  => "Bulk imported discounts via spreadsheet",
                'module'  => 'Discounts',
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'success_count' => 'File processed', 
                'error_count' => 0,
                'errors' => [],
                'message' => 'Import completed successfully!'
            ]);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // Catch specific spreadsheet validation errors
            $failures = $e->failures();
            $errorMsgs = [];
            foreach ($failures as $failure) {
                $errorMsgs[] = "Row {$failure->row()}: " . implode(", ", $failure->errors());
            }

            return response()->json([
                'success_count' => 0,
                'error_count' => count($errorMsgs),
                'errors' => $errorMsgs
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    public function importHistory()
    {
        // Fetch logs specifically related to bulk imports
        $history = AuditLog::where('action', 'LIKE', 'Bulk%')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get(['id', 'action', 'created_at', 'ip_address']);

        return response()->json($history);
    }
}