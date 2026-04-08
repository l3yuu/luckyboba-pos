<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Branch;
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
        $query = Expense::with('branch:id,name');

        // Filters
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        // Transform for frontend
        $data = $expenses->map(function ($e) {
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
                'recorded_by'  => $e->recorded_by ?? 'Admin',
                'created_at'   => $e->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data
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
            'receipt'      => 'nullable|image|max:2048', // max 2MB
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
            'recorded_by'  => auth()->user()->name ?? 'Admin',
            'ref_num'      => 'EXP-' . strtoupper(uniqid()),
        ]);

        // Load branch relation for response
        $expense->load('branch:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Expense recorded successfully',
            'data'    => $this->transform($expense)
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|numeric|min:0',
            'category'     => 'required|string',
            'branch_id'    => 'required|integer|exists:branches,id',
            'expense_date' => 'required|date',
            'notes'        => 'nullable|string',
            'receipt'      => 'nullable|image|max:2048',
        ]);

        $data = [
            'title'     => $validated['title'],
            'amount'    => $validated['amount'],
            'category'  => $validated['category'],
            'branch_id' => $validated['branch_id'],
            'date'      => $validated['expense_date'],
            'notes'     => $validated['notes'] ?? null,
        ];

        if ($request->hasFile('receipt')) {
            // Delete old receipt if exists
            if ($expense->receipt_path) {
                $oldPath = str_replace(asset('storage/'), '', $expense->receipt_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('receipt')->store('receipts', 'public');
            $data['receipt_path'] = asset('storage/' . $path);
        }

        $expense->update($data);
        $expense->load('branch:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'data'    => $this->transform($expense)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense)
    {
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
        $query = Expense::with('branch:id,name');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $expenses = $query->orderBy('date', 'desc')->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=expenses-" . now()->format('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['Date', 'Title', 'Category', 'Branch', 'Amount', 'Recorded By', 'Notes'];

        $callback = function() use($expenses, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($expenses as $e) {
                fputcsv($file, [
                    Carbon::parse($e->date)->format('Y-m-d'),
                    $e->title,
                    $e->category,
                    $e->branch->name ?? '—',
                    $e->amount,
                    $e->recorded_by ?? 'Admin',
                    $e->notes
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Transform model for frontend
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
            'recorded_by'  => $e->recorded_by ?? 'Admin',
            'created_at'   => $e->created_at->toISOString(),
        ];
    }
}