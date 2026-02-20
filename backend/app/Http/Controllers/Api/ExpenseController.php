<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Sale; // Assuming you have a Sales model
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query();

        // Date Range Filtering
        if ($request->from && $request->to) {
            $query->whereBetween('date', [$request->from, $request->to]);
        }

        // Search by Ref #
        if ($request->ref) {
            $query->where('ref_num', 'like', '%' . $request->ref . '%');
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        // Summary Calculations
        $totalExpense = $expenses->sum('amount');
        
        // Fetch real sales data for the same period
        $totalSales = Sale::whereBetween('created_at', [$request->from, $request->to])
                         ->where('status', 'completed')
                         ->sum('total_amount');

        return response()->json([
            'expenses' => $expenses,
            'summary' => [
                'totalExpense' => (float)$totalExpense,
                'totalSales' => (float)$totalSales,
                'netTotal' => (float)($totalSales - $totalExpense)
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'refNum' => 'required|unique:expenses,ref_num',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'category' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        // Map frontend camelCase to backend snake_case
        $expense = Expense::create([
            'ref_num' => $validated['refNum'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'category' => $validated['category'],
            'amount' => $validated['amount'],
        ]);

        return response()->json($expense, 201);
    }
}