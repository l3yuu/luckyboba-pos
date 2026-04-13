<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Sale;
use App\Models\User;
use App\Models\Branch;
use Carbon\Carbon;

class PulseController extends Controller
{
    /**
     * Get the "Pulse" data for the real-time dashboard.
     */
    public function index(Request $request)
    {
        $activeThreshold = now()->subMinutes(5);
        $onlineThreshold = now()->subMinutes(15);

        // Allow filtering by branch_id (e.g. for Branch Managers)
        $user = auth()->user();
        $branchId = $request->query('branch_id') ?: ($user->role !== 'superadmin' ? $user->branch_id : null);

        // 1. Latest 10 sales from TODAY ONLY
        $recentSalesQuery = Sale::with(['branch', 'user'])
            ->where('status', 'completed')
            ->whereDate('created_at', Carbon::today())
            ->latest()
            ->take(10);

        if ($branchId) {
            $recentSalesQuery->where('branch_id', $branchId);
        }

        $recentSales = $recentSalesQuery->get()
            ->map(function ($sale) {
                return [
                    'id'             => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'total_amount'   => $sale->total_amount,
                    'branch_name'    => $sale->branch->name ?? 'N/A',
                    'cashier_name'   => $sale->user->name ?? $sale->cashier_name,
                    'created_at'     => $sale->created_at->diffForHumans(),
                    'timestamp'      => $sale->created_at->toIso8601String(),
                ];
            });

        // 2. Total Sales for Today
        $todayTotalQuery = Sale::where('status', 'completed')
            ->whereDate('created_at', Carbon::today());
        
        if ($branchId) {
            $todayTotalQuery->where('branch_id', $branchId);
        }
        $todayTotal = $todayTotalQuery->sum('total_amount');

        // 3. Active Users (last 5 mins)
        $activeUsersQuery = User::with('branch')
            ->where('last_activity_at', '>=', $activeThreshold);
        
        if ($branchId) {
            $activeUsersQuery->where('branch_id', $branchId);
        }

        $activeUsers = $activeUsersQuery->get()
            ->map(function ($user) {
                return [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'role'        => $user->role,
                    'branch_name' => $user->branch->name ?? 'N/A',
                    'last_seen'   => $user->last_activity_at ? $user->last_activity_at->diffForHumans() : 'N/A',
                ];
            });

        // 4. Branch Status
        $branchesQuery = Branch::query();
        if ($branchId) {
            $branchesQuery->where('id', $branchId);
        }

        $branches = $branchesQuery->get()->map(function ($branch) use ($activeUsers, $onlineThreshold) {
            $hasActiveUser = $activeUsers->contains('branch_name', $branch->name);
            $hasRecentSale = Sale::where('branch_id', $branch->id)
                ->where('created_at', '>=', $onlineThreshold)
                ->exists();

            return [
                'id'       => $branch->id,
                'name'     => $branch->name,
                'location' => $branch->location,
                'status'   => ($hasActiveUser || $hasRecentSale) ? 'online' : 'offline',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'recent_sales'   => $recentSales,
                'active_users'   => $activeUsers,
                'branch_status'  => $branches,
                'server_time'    => now()->toIso8601String(),
                'stats' => [
                    'today_total'     => $todayTotal,
                    'online_branches' => $branches->where('status', 'online')->count(),
                    'total_branches'  => $branches->count(),
                    'active_staff'    => $activeUsers->count(),
                ]
            ]
        ]);
    }

}
