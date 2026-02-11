<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashCount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CashCountController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'total' => 'required|numeric',
            'breakdown' => 'required|array',
            'remarks' => 'nullable|string',
        ]);

        $cashCount = CashCount::create([
            'terminal_id' => '01',
            'total_amount' => $validated['total'],
            'breakdown' => $validated['breakdown'],
            'remarks' => $validated['remarks'],
            'user_id' => $request->user()->id, // Links to the logged-in user
        ]);

        return response()->json($cashCount, 201);
    }
}
