<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiscountController extends Controller
{
    public function index()
    {
        return response()->json(Discount::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'amount' => 'required|numeric',
            'type'   => 'required|string',
            'status' => 'required|in:ON,OFF'
        ]);

        $discount = Discount::create($validated);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action'  => "Created discount: {$discount->name}",
            'module'  => 'Discounts', // Added module for better filtering
            'ip_address' => $request->ip()
        ]);

        return response()->json($discount, 201);
    }

    public function toggleStatus(Discount $discount) 
    {
        try {
            $oldStatus = $discount->status;
            $discount->status = ($oldStatus === 'ON') ? 'OFF' : 'ON';
            $discount->save();
            
            // Audit the status change
            AuditLog::create([
                'user_id' => Auth::id(),
                'action'  => "Changed {$discount->name} status from {$oldStatus} to {$discount->status}",
                'module'  => 'Discounts',
                'ip_address' => request()->ip()
            ]);

            return response()->json($discount);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Discount $discount)
    {
        try {
            $discountName = $discount->name;
            $discount->delete();

            // Audit the deletion
            AuditLog::create([
                'user_id' => Auth::id(),
                'action'  => "Deleted discount: {$discountName}",
                'module'  => 'Discounts',
                'ip_address' => request()->ip()
            ]);

            return response()->json(['message' => 'Deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}