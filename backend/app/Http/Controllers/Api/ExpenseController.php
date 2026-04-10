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
        $from = $request->date_from ?? $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->date_to   ?? $request->to   ?? now()->toDateString();
        $user = $request->user();

        $query = Expense::with(['branch', 'recorder']);

        // Role-based filtering
        if ($user->role !== 'superadmin') {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

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

        // Total Sales calculation (scoped same as expenses)
        $salesQuery = Sale::whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->where('status', 'completed');

        if ($user->role !== 'superadmin') {
            $salesQuery->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $salesQuery->where('branch_id', $request->branch_id);
        }

        $totalSales = (float) $salesQuery->sum('total_amount');

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
            'refNum'      => 'required|unique:expenses,ref_num',
            'title'       => 'required|string',
            'description' => 'nullable|string', // Support old key if sent
            'notes'       => 'nullable|string',
            'date'        => 'required|date',
            'category'    => 'required|string',
            'amount'      => 'required|numeric',
            'branch_id'   => 'nullable|integer' // SuperAdmin can specify branch
        ]);

        $user = $request->user();
        
        // Use provided title or fallback to description (from old cashier UI)
        $title = $validated['title'] ?? $validated['description'] ?? 'Untitled Expense';

        $expense = Expense::create([
            'branch_id'   => $user->role === 'superadmin' ? ($validated['branch_id'] ?? $user->branch_id) : $user->branch_id,
            'recorded_by' => $user->id,
            'ref_num'     => $validated['refNum'],
            'title'       => $title,
            'notes'       => $validated['notes'] ?? null,
            'date'        => $validated['date'],
            'category'    => $validated['category'],
            'amount'      => $validated['amount'],
        ]);

        return response()->json([
            'message' => 'Expense recorded successfully',
            'data'    => $expense->load(['branch', 'recorder'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);
        
        $validated = $request->validate([
            'refNum'    => 'sometimes|required|unique:expenses,ref_num,' . $id,
            'title'     => 'sometimes|required|string',
            'notes'     => 'nullable|string',
            'date'      => 'sometimes|required|date',
            'category'  => 'sometimes|required|string',
            'amount'    => 'sometimes|required|numeric',
            'branch_id' => 'nullable|integer'
        ]);

        $user = $request->user();
        if ($user->role !== 'superadmin' && $expense->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $expense->update([
            'ref_num'   => $validated['refNum'] ?? $expense->ref_num,
            'title'     => $validated['title'] ?? $expense->title,
            'notes'     => $validated['notes'] ?? $expense->notes,
            'date'      => $validated['date'] ?? $expense->date,
            'category'  => $validated['category'] ?? $expense->category,
            'amount'    => $validated['amount'] ?? $expense->amount,
            'branch_id' => $user->role === 'superadmin' ? ($validated['branch_id'] ?? $expense->branch_id) : $expense->branch_id,
        ]);

        return response()->json([
            'message' => 'Expense updated successfully',
            'data'    => $expense->load(['branch', 'recorder'])
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);
        $user = $request->user();

        if ($user->role !== 'superadmin' && $expense->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }

    public function export(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->toDateString();
        $user = $request->user();

        $query = Expense::with(['branch', 'recorder']);

        if ($user->role !== 'superadmin') {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $query->whereBetween('date', [$from, $to]);

        if ($request->category && $request->category !== 'ALL') {
            $query->where('category', $request->category);
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        $filename = "expenses_export_" . now()->format('Y-m-d_H-i-s') . ".csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($expenses) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Reference #', 'Title', 'Category', 'Branch', 'Amount', 'Recorded By', 'Notes']);

            foreach ($expenses as $exp) {
                fputcsv($file, [
                    $exp->date->format('Y-m-d'),
                    $exp->ref_num,
                    $exp->title,
                    $exp->category,
                    $exp->branch?->name ?? 'N/A',
                    $exp->amount,
                    $exp->recorder?->name ?? 'Admin',
                    $exp->notes
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}