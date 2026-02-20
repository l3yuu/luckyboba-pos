<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Carbon\Carbon; // <--- MAKE SURE THIS IS HERE

class PurchaseOrderController extends Controller
{
    public function index()
    {
        try {
            $orders = PurchaseOrder::orderBy('date_ordered', 'desc')->get();
            
            $stats = [
                'active_orders' => PurchaseOrder::where('status', 'Pending')->count(),
                'pending_payment' => (float) PurchaseOrder::where('status', 'Pending')->sum('total_amount'),
                'monthly_spend' => (float) PurchaseOrder::whereMonth('date_ordered', Carbon::now()->month)
                                    ->where('status', 'Received')
                                    ->sum('total_amount'),
            ];

            return response()->json([
                'orders' => $orders,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'supplier' => 'required|string',
                'total_amount' => 'required|numeric',
                'date_ordered' => 'required|date',
            ]);

            // Auto-generate PO Number
            $count = PurchaseOrder::whereYear('created_at', date('Y'))->count() + 1;
            $poNumber = "PO-" . date('Y') . "-" . str_pad($count, 3, '0', STR_PAD_LEFT);

            $order = PurchaseOrder::create(array_merge($validated, [
                'po_number' => $poNumber,
                'status' => 'Pending'
            ]));

            return response()->json($order, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}