<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
<<<<<<< HEAD

class QueueController extends Controller
{
    public function active(Request $request)
    {
        $branchId = $request->query('branch_id');

        $query = Sale::whereIn('status', ['preparing', 'ready'])
            ->whereDate('created_at', today())
            ->orderBy('created_at', 'asc');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $activeOrders = $query->get(['id', 'queue_number', 'status', 'source', 'customer_name', 'invoice_number']);

        return response()->json([
            'success' => true,
            'data' => $activeOrders
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:preparing,ready,completed,cancelled'
        ]);

        $sale = Sale::findOrFail($id);
        $sale->status = $request->status;
        $sale->save();

        return response()->json([
            'success' => true,
            'message' => 'Queue status updated successfully'
=======
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
>>>>>>> origin/main
        ]);
    }
}
