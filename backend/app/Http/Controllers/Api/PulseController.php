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
    public function index()
    {
        $activeThreshold = now()->subMinutes(5);
        $onlineThreshold = now()->subMinutes(15);

        // 1. Latest 10 sales from TODAY ONLY (to keep it consistent with "Live Sales Today")
        $recentSales = Sale::with(['branch', 'user'])
            ->where('status', 'completed')
            ->whereDate('created_at', Carbon::today())
            ->latest()
            ->take(10)
            ->get()
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

        // 2. Total Sales for Today (accurate beyond the last 10)
        $todayTotal = Sale::where('status', 'completed')
            ->whereDate('created_at', Carbon::today())
            ->sum('total_amount');

        // 3. Active Users (last 5 mins)
        $activeUsers = User::with('branch')
            ->where('last_activity_at', '>=', $activeThreshold)
            ->get()
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
        // A branch is "online" if it has an active user OR a sale in the last 15 mins
        $branches = Branch::all()->map(function ($branch) use ($activeUsers, $onlineThreshold) {
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
