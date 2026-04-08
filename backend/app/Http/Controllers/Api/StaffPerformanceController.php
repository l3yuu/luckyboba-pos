<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Sale;
use App\Models\VoidRequest;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StaffPerformanceController extends Controller
{
    /**
     * Get a ranked list of staff members based on sales, speed, and void metrics.
     */
    public function index(Request $request)
    {
        $period = $request->query('period', 'monthly');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', Carbon::now()->toDateString());

        if (!$startDate) {
            $startDate = match ($period) {
                'daily' => Carbon::today()->toDateString(),
                'weekly' => Carbon::now()->startOfWeek()->toDateString(),
                'monthly' => Carbon::now()->startOfMonth()->toDateString(),
                default => Carbon::now()->startOfMonth()->toDateString(),
            };
        }

        // 1. Get Sales Summary per User
        $salesSummary = Sale::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', '!=', 'cancelled')
            ->select(
                'user_id',
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('MIN(created_at) as first_sale'),
                DB::raw('MAX(created_at) as last_sale')
            )
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        // 2. Get Void Summary per User
        $voidSummary = VoidRequest::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', 'approved')
            ->select(
                'cashier_id',
                DB::raw('COUNT(*) as approved_voids')
            )
            ->groupBy('cashier_id')
            ->get()
            ->keyBy('cashier_id');

        // 3. Combine and Format Results
        $staff = User::whereIn('id', $salesSummary->keys())
            ->with('branch:id,name')
            ->get()
            ->map(function ($user) use ($salesSummary, $voidSummary) {
                $sales = $salesSummary->get($user->id);
                $voids = $voidSummary->get($user->id);

                $rev = (float)($sales->total_revenue ?? 0);
                $count = (int)($sales->transaction_count ?? 0);
                $vCount = (int)($voids->approved_voids ?? 0);

                // Calculate Void Rate (Voids / Total Handled Actions)
                $voidRate = ($count + $vCount > 0) ? ($vCount / ($count + $vCount)) * 100 : 0;

                // Calculate Efficiency (Trans per Hour)
                // We estimate active hours by looking at daily spans, but for simplicity here we'll use total days in range
                $first = Carbon::parse($sales->first_sale);
                $last = Carbon::parse($sales->last_sale);
                $hoursDiff = max($first->diffInHours($last), 1); // Minimum 1 hour
                $transPerHour = $count / $hoursDiff;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'branch' => $user->branch_name ?? 'N/A',
                    'revenue' => $rev,
                    'transactions' => $count,
                    'voids' => $vCount,
                    'void_rate' => round($voidRate, 2),
                    'trans_per_hour' => round($transPerHour, 2),
                    'avg_sale' => $count > 0 ? round($rev / $count, 2) : 0,
                    'is_risk' => $voidRate > 5 // Mark as risk if > 5% void rate
                ];
            })
            ->sortByDesc('revenue')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $staff,
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }
}
