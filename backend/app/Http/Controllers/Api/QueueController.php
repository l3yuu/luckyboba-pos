<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QueueController extends Controller
{
    /**
     * Get the active queue for a specific branch.
     * Accessible publicly for the display board.
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');

        if (!$branchId) {
            return response()->json(['success' => false, 'message' => 'branch_id is required'], 400);
        }

        $orders = Sale::where('branch_id', $branchId)
            ->whereIn('status', ['preparing', 'ready'])
            ->whereDate('created_at', now()->toDateString())
            ->orderBy('created_at', 'asc')
            ->get(['id', 'queue_number', 'status', 'source', 'customer_name', 'invoice_number']);

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }
}
