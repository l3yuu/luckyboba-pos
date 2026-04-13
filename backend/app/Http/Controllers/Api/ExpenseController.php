<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $from = $request->date_from ?? $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->date_to   ?? $request->to   ?? now()->toDateString();
        $user = $request->user();

        $query = Expense::with(['branch:id,name', 'recorder:id,name']);

        // Role-based filtering
        if ($user->role !== 'superadmin') {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        // Date Range Filtering
        $query->whereBetween('date', [$from, $to]);

        // Category Filter
        if ($request->category && $request->category !== 'ALL') {
            $query->where('category', $request->category);
        }

        // Search by Title or Ref #
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('ref_num', 'like', '%' . $request->search . '%');
            });
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        // Calculate Totals for Stats
        $totalExpense = (float) $expenses->sum('amount');

        // Total Sales calculation (scoped same as expenses for comparison)
        $salesQuery = Sale::whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->where('status', 'completed');

        if ($user->role !== 'superadmin') {
            $salesQuery->where('branch_id', $user->branch_id);
        } elseif ($request->branch_id) {
            $salesQuery->where('branch_id', $request->branch_id);
        }
        $totalSales = (float) $salesQuery->sum('total_amount');

        return response()->json([
            'success' => true,
            'data'    => $expenses->map(function(Expense $e) { return $this->transform($e); }),
            'summary' => [
                'total_expense' => $totalExpense,
                'total_sales'   => $totalSales,
                'count'         => $expenses->count()
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|numeric|min:0',
            'category'     => 'required|string',
            'branch_id'    => 'required|integer|exists:branches,id',
            'expense_date' => 'required|date',
            'notes'        => 'nullable|string',
            'receipt'      => 'nullable|image|max:2048',
            'refNum'       => 'nullable|string|unique:expenses,ref_num'
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            $receiptPath = asset('storage/' . $path);
        }

        $expense = Expense::create([
            'title'        => $validated['title'],
            'amount'       => $validated['amount'],
            'category'     => $validated['category'],
            'branch_id'    => $validated['branch_id'],
            'date'         => $validated['expense_date'],
            'notes'        => $validated['notes'] ?? null,
            'receipt_path' => $receiptPath,
            'recorded_by'  => $request->user()->id,
            'ref_num'      => $validated['refNum'] ?? 'EXP-' . strtoupper(uniqid()),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense recorded successfully',
            'data'    => $this->transform($expense->load(['branch', 'recorder']))
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|numeric|min:0',
            'category'     => 'required|string',
            'branch_id'    => 'required|integer|exists:branches,id',
            'expense_date' => 'required|date',
            'notes'        => 'nullable|string',
            'receipt'      => 'nullable|image|max:2048',
            'refNum'       => 'nullable|string|unique:expenses,ref_num,' . $id
        ]);

        $user = $request->user();
        if ($user->role !== 'superadmin' && $expense->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = [
            'title'     => $validated['title'],
            'amount'    => $validated['amount'],
            'category'  => $validated['category'],
            'branch_id' => $validated['branch_id'],
            'date'      => $validated['expense_date'],
            'notes'     => $validated['notes'] ?? null,
            'ref_num'   => $validated['refNum'] ?? $expense->ref_num,
        ];

        if ($request->hasFile('receipt')) {
            if ($expense->receipt_path) {
                $oldPath = str_replace(asset('storage/'), '', $expense->receipt_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('receipt')->store('receipts', 'public');
            $data['receipt_path'] = asset('storage/' . $path);
        }

        $expense->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'data'    => $this->transform($expense->load(['branch', 'recorder']))
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);
        $user = $request->user();

        if ($user->role !== 'superadmin' && $expense->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($expense->receipt_path) {
            $oldPath = str_replace(asset('storage/'), '', $expense->receipt_path);
            Storage::disk('public')->delete($oldPath);
        }
        
        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully'
        ]);
    }

    /**
     * Export expenses to CSV.
     */
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
                    Carbon::parse($exp->date)->format('Y-m-d'),
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

    /**
     * Transform model to standardized frontend format.
     */
    private function transform(Expense $e)
    {
        return [
            'id'           => $e->id,
            'title'        => $e->title,
            'amount'       => (float) $e->amount,
            'category'     => $e->category,
            'branch_id'    => $e->branch_id,
            'branch_name'  => $e->branch->name ?? '—',
            'expense_date' => Carbon::parse($e->date)->format('Y-m-d'),
            'receipt_path' => $e->receipt_path,
            'notes'        => $e->notes,
            'ref_num'      => $e->ref_num,
            'recorded_by'  => $e->recorder->name ?? 'Admin',
            'created_at'   => $e->created_at->toISOString(),
        ];
    }
}