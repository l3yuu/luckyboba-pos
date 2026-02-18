<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemSerial;
use Illuminate\Http\Request;

class ItemSerialController extends Controller
{
    public function index(Request $request)
    {
        $query = ItemSerial::query();

        // Search functionality
        if ($request->has('search')) {
            $query->where('serial_number', 'like', '%' . $request->search . '%')
                  ->orWhere('item_name', 'like', '%' . $request->search . '%');
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'All Status') {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'serial_number' => 'required|string|unique:item_serials,serial_number',
            'status' => 'required|in:In Stock,Sold,Defective',
        ]);

        $validated['date_added'] = now()->toDateString();

        $serial = ItemSerial::create($validated);
        return response()->json($serial, 201);
    }
}