<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ItemSerialController extends Controller
{
    /**
     * Fetch serials with optional search and status filtering.
     */
    public function index(Request $request)
    {
        try {
            // FIX: Select the actual 'date_added' column that exists in your database
            $query = DB::table('item_serials')
                ->select('id', 'item_name', 'serial_number', 'status', 'date_added')
                ->orderBy('date_added', 'desc');

            // Apply Search Filter
            if ($request->filled('search')) {
                $searchTerm = '%' . $request->search . '%';
                $query->where(function($q) use ($searchTerm) {
                    $q->where('serial_number', 'LIKE', $searchTerm)
                      ->orWhere('item_name', 'LIKE', $searchTerm);
                });
            }

            // Apply Status Filter
            if ($request->filled('status') && $request->status !== 'All Status') {
                $query->where('status', $request->status);
            }

            $serials = $query->get()->map(function ($serial) {
                // Format the date for the frontend
                $serial->date_added = \Carbon\Carbon::parse($serial->date_added)->format('m/d/Y H:i A');
                return $serial;
            });

            return response()->json($serials);
        } catch (\Exception $e) {
            Log::error("ItemSerial Fetch Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch serials'], 500);
        }
    }

    /**
     * Store a new serial number record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'serial_number' => 'required|string|unique:item_serials,serial_number',
            'status' => 'required|in:In Stock,Sold,Defective'
        ]);

        try {
            $id = DB::table('item_serials')->insertGetId([
                'item_name' => $validated['item_name'],
                'serial_number' => $validated['serial_number'],
                'status' => $validated['status'],
                'date_added' => now(), // FIX: This satisfies the SQL requirement
                'created_at' => now(), // Keeping these just in case your table expects them too
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Serial registered successfully', 'id' => $id], 201);
        } catch (\Exception $e) {
            Log::error("ItemSerial Store Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to register serial'], 500);
        }
    }

    /**
     * Update the status of a specific serial number.
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:In Stock,Sold,Defective'
        ]);

        try {
            DB::table('item_serials')->where('id', $id)->update([
                'status' => $validated['status'],
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Status updated successfully']);
        } catch (\Exception $e) {
            Log::error("ItemSerial Update Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to update status'], 500);
        }
    }
}