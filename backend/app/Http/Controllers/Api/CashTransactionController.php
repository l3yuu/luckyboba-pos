<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CashierService;
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
}