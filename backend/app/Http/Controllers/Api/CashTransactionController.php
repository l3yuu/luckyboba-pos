<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CashierService;
use App\Models\CashTransaction; 
use Illuminate\Support\Facades\Auth; 
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CashTransactionController extends Controller
{
    protected $cashierService;

    public function __construct(CashierService $cashierService)
    {
        $this->cashierService = $cashierService;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'   => 'required|in:cash_in,cash_out,cash_drop',
            'amount' => 'required|numeric|min:0',
            'note'   => 'nullable|string|max:255',
        ]);

        try {
            $transaction = $this->cashierService->recordCashMovement(
                $validated['type'],
                $validated['amount'],
                $validated['note']
            );

            return response()->json([
                'success' => true,
                'message' => 'Transaction recorded successfully',
                'data' => $transaction
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request) 
    {
        // Added a check to make sure the user is actually logged in
        $userId = Auth::id();
        
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = CashTransaction::where('user_id', $userId);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }
}