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
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        $query = Expense::query();

        // Date Range Filtering
        $query->whereBetween('date', [$from, $to]);

        // Search by Ref #
        if ($request->ref) {
            $query->where('ref_num', 'like', '%' . $request->ref . '%');
        }

        // Category Filter
        if ($request->category && $request->category !== 'ALL') {
            $query->where('category', $request->category);
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        $totalExpense = (float) $expenses->sum('amount');

        // Always use full datetime range so sales on boundary dates are included
        $totalSales = (float) Sale::whereBetween('created_at', [
            $from . ' 00:00:00',
            $to   . ' 23:59:59',
        ])
            ->where('status', 'completed')
            ->sum('total_amount');

        return response()->json([
            'expenses' => $expenses,
            'summary'  => [
                'totalExpense' => $totalExpense,
                'totalSales'   => $totalSales,
                'netTotal'     => $totalSales - $totalExpense,
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