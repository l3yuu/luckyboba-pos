<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    /**
     * Display a listing of all branches
     */
    public function index()
    {
        try {
            $branches = Branch::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $branches,
                'message' => 'Branches retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve branches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created branch
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:branches,name',
            'location' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ], [
            'name.required' => 'Branch name is required',
            'name.unique' => 'A branch with this name already exists',
            'location.required' => 'Location is required',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be either active or inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create the branch
            $branch = Branch::create([
                'name' => $request->input('name'),
                'location' => $request->input('location'),
                'status' => $request->input('status'),
                'total_sales' => 0.00,
                'today_sales' => 0.00,
            ]);

            // Note: Sales totals start at 0 for new branches
            // They will automatically update when sales are assigned via triggers

            return response()->json([
                'success' => true,
                'data' => $branch,
                'message' => 'Branch created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified branch
     */
    public function show($id)
    {
        try {
            $branch = Branch::with(['users', 'sales' => function($query) {
                $query->latest()->limit(10);
            }])->findOrFail($id);

            // Get additional statistics
            $statistics = [
                'total_users' => $branch->users->count(),
                'active_users' => $branch->activeUsers->count(),
                'managers' => $branch->managers->count(),
                'cashiers' => $branch->cashiers->count(),
                'total_transactions' => $branch->sales->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $branch,
                'statistics' => $statistics,
                'message' => 'Branch retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Branch not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified branch
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:branches,name,' . $id,
            'location' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $branch = Branch::findOrFail($id);
            
            $branch->update($request->only(['name', 'location', 'status']));

            return response()->json([
                'success' => true,
                'data' => $branch,
                'message' => 'Branch updated successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified branch
     */
    public function destroy($id)
    {
        try {
            $branch = Branch::findOrFail($id);
            
            // Check if branch has sales
            $hasSales = $branch->sales()->exists();
            $hasUsers = $branch->users()->exists();

            if ($hasSales || $hasUsers) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete branch with existing sales or users. Consider marking it as inactive instead.',
                ], 400);
            }

            $branch->delete();

            return response()->json([
                'success' => true,
                'message' => 'Branch deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete branch',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get branch performance statistics
     */
    public function performance()
    {
        try {
            $performance = DB::table('branch_performance')->get();

            return response()->json([
                'success' => true,
                'data' => $performance,
                'message' => 'Branch performance retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve branch performance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's sales by branch
     */
    public function todaySales()
    {
        try {
            $todaySales = DB::table('today_sales_by_branch')->get();

            return response()->json([
                'success' => true,
                'data' => $todaySales,
                'message' => 'Today\'s sales retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve today\'s sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get daily sales history for a specific branch
     */
    public function dailySales($id)
    {
        try {
            $dailySales = DB::table('daily_sales_by_branch')
                ->where('branch_id', $id)
                ->orderBy('sale_date', 'desc')
                ->limit(30) // Last 30 days
                ->get();

            return response()->json([
                'success' => true,
                'data' => $dailySales,
                'message' => 'Daily sales retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve daily sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manually refresh branch totals
     */
    public function refreshTotals($id)
    {
        try {
            DB::statement('CALL update_branch_totals(?)', [$id]);
            
            $branch = Branch::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $branch,
                'message' => 'Branch totals refreshed successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh branch totals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get branch sales summary (specific to branch_id)
     */
    public function salesSummary($id)
    {
        try {
            $branch = Branch::findOrFail($id);

            // Sales specific to this branch only
            $summary = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'location' => $branch->location,
                'status' => $branch->status,
                'total_sales' => (float) $branch->total_sales,
                'today_sales' => (float) $branch->today_sales,
                'transactions_today' => $branch->sales()->whereDate('created_at', today())->count(),
                'total_transactions' => $branch->sales()->count(),
                'avg_transaction_value' => (float) $branch->sales()->avg('total_amount') ?? 0,
                'payment_methods' => $branch->sales()
                    ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total'))
                    ->groupBy('payment_method')
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
                'message' => 'Branch sales summary retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}