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
        $dates = $this->resolveDates($request);
        $branchId = $this->resolveBranchId($request);

        $salesSummary = $this->getSalesSummary($dates['start'], $dates['end'], $branchId);
        $voidSummary = $this->getVoidSummary($dates['start'], $dates['end'], $branchId);

        $staff = $this->formatStaffResults($salesSummary, $voidSummary, $branchId);

        return response()->json([
            'success' => true,
            'data' => $staff,
            'period' => [
                'start' => $dates['start'],
                'end' => $dates['end']
            ]
        ]);
    }

    private function resolveDates(Request $request)
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

        return ['start' => $startDate, 'end' => $endDate];
    }

    private function resolveBranchId(Request $request)
    {
        $user = auth()->user();
        return $request->query('branch_id') ?: ($user->role !== 'superadmin' ? $user->branch_id : null);
    }

    private function getSalesSummary($startDate, $endDate, $branchId)
    {
        $query = Sale::join('branches', 'sales.branch_id', '=', 'branches.id')
            ->whereNull('branches.deleted_at')
            ->whereBetween('sales.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('sales.status', '!=', 'cancelled');
        
        if ($branchId) {
            $query->where('sales.branch_id', $branchId);
        }

        return $query->select(
                'sales.user_id',
                DB::raw('SUM(sales.total_amount) as total_revenue'),
                DB::raw('COUNT(sales.id) as transaction_count'),
                DB::raw('MIN(sales.created_at) as first_sale'),
                DB::raw('MAX(sales.created_at) as last_sale')
            )
            ->groupBy('sales.user_id')
            ->get()
            ->keyBy('user_id');
    }

    private function getVoidSummary($startDate, $endDate, $branchId)
    {
        $query = VoidRequest::join('sales', 'void_requests.sale_id', '=', 'sales.id')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->whereNull('branches.deleted_at')
            ->whereBetween('void_requests.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('void_requests.status', 'approved');
        
        if ($branchId) {
            $query->where('sales.branch_id', $branchId);
        }

        return $query->select(
                'cashier_id',
                DB::raw('COUNT(*) as approved_voids')
            )
            ->groupBy('cashier_id')
            ->get()
            ->keyBy('cashier_id');
    }

    private function formatStaffResults($salesSummary, $voidSummary, $branchId)
    {
        $staffQuery = User::whereIn('id', $salesSummary->keys())
            ->with('branch:id,name');

        if ($branchId) {
            $staffQuery->where('branch_id', $branchId);
        }

        return $staffQuery->get()
            ->map(function ($user) use ($salesSummary, $voidSummary) {
                $sales = $salesSummary->get($user->id);
                $voids = $voidSummary->get($user->id);

                $rev = (float)($sales->total_revenue ?? 0);
                $count = (int)($sales->transaction_count ?? 0);
                $vCount = (int)($voids->approved_voids ?? 0);

                $voidRate = ($count + $vCount > 0) ? ($vCount / ($count + $vCount)) * 100 : 0;

                $first = Carbon::parse($sales->first_sale);
                $last = Carbon::parse($sales->last_sale);
                $hoursDiff = max($first->diffInHours($last), 1); 
                $transPerHour = $count / $hoursDiff;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'branch_name' => $user->branch->name ?? 'N/A',
                    'revenue' => $rev,
                    'transactions' => $count,
                    'voids' => $vCount,
                    'void_rate' => round($voidRate, 2),
                    'trans_per_hour' => round($transPerHour, 2),
                    'avg_sale' => $count > 0 ? round($rev / $count, 2) : 0,
                    'is_risk' => $voidRate > 5 
                ];
            })
            ->sortByDesc('revenue')
            ->values();
    }
}
