<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\RawMaterial;
use App\Models\PosDevice;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Receipt;
use App\Models\StockDeduction;
use App\Models\CashCount;
use App\Models\ZReading;
use App\Models\RawMaterialLog;
use App\Models\Expense;
use App\Models\PurchaseOrder;
use App\Models\StockTransfer;
use App\Models\CashTransaction;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    /**
     * GET /api/branches
     */
    public function index()
    {
        try {
            $branches = Branch::query()
                ->withCount('users as staff_count')
                ->with(['manager:id,name,branch_id,role'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn(Branch $branch) => array_merge($branch->toArray(), [
                    'manager_name' => $branch->manager?->name ?? '—',
                    'staff_count'  => $branch->staff_count ?? 0,
                    'is_deleted'   => $branch->trashed(),
                ]));

            return response()->json([
                'success' => true,
                'data'    => $branches,
                'message' => 'Branches retrieved successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve branches',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Public endpoint for mobile app store finder
     * GET /api/branches/available
     */
    public function availableBranches()
    {
        try {
            $branches = Branch::where('status', 'active')
                ->select(['id', 'name', 'location', 'store_address', 'latitude', 'longitude', 'status', 'image'])
                ->get()
                ->map(function (Branch $branch) {
                    return array_merge($branch->toArray(), [
                        'image' => $branch->image ? url('storage/' . $branch->image) : null,
                    ]);
                });

            return response()->json([
                'success' => true,
                'data'    => $branches
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available branches'
            ], 500);
        }
    }

    /**
     * POST /api/branches
     */
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
    'name'           => 'required|string|max:255|unique:branches,name',
    'location'       => 'required|string|max:255',
    'status'         => 'required|in:active,inactive',
    'ownership_type' => 'sometimes|in:company,franchise',
    'vat_type'       => 'sometimes|in:vat,non_vat',
    'owner_name'     => 'sometimes|nullable|string|max:255',
    'brand'          => 'sometimes|nullable|string|max:255',
    'company_name'   => 'sometimes|nullable|string|max:255',
    'store_address'  => 'sometimes|nullable|string|max:500',
    'vat_reg_tin'    => 'sometimes|nullable|string|max:255',
    'min_number'     => 'sometimes|nullable|string|max:255',
    'serial_number'  => 'sometimes|nullable|string|max:255',
    'latitude'       => 'sometimes|nullable|string',
        'longitude'      => 'sometimes|nullable|string',
        'image'          => 'sometimes|nullable|image|max:2048',
        'manager_id'     => 'sometimes|nullable|exists:users,id',
    ], [
    'name.required'     => 'Branch name is required.',
    'name.unique'       => 'A branch with this name already exists.',
    'location.required' => 'Location is required.',
    'status.required'   => 'Status is required.',
    'status.in'         => 'Status must be active or inactive.',
]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors'  => $validator->errors(),
        ], 422);
    }

    try {
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('branches', 'public');
        }

        $branch = Branch::create([
            'name'           => $request->name,
            'location'       => $request->location,
            'status'         => $request->status,
            'ownership_type' => $request->ownership_type ?? 'company',
            'vat_type'       => $request->vat_type       ?? 'vat',
            'total_sales'    => 0.00,
            'today_sales'    => 0.00,
            'brand'          => $request->brand          ?? 'Lucky Boba Milk Tea',
            'company_name'   => $request->company_name   ?? '',
            'store_address'  => $request->store_address  ?? '',
            'vat_reg_tin'    => $request->vat_reg_tin    ?? '',
            'min_number'     => $request->min_number     ?? '',
            'serial_number'  => $request->serial_number  ?? '',
            'owner_name'     => $request->owner_name     ?? '',  
            'latitude'       => $request->latitude,
            'longitude'      => $request->longitude,
            'image'          => $imagePath,
        ]);

            AuditHelper::log('branch', "Created branch: {$branch->name}");

            if ($request->manager_id) {
                \App\Models\User::where('id', $request->manager_id)
                    ->update([
                        'branch_id'   => $branch->id,
                        'branch_name' => $branch->name
                    ]);
            }

            // Auto-clone all global raw materials to the new branch
            $globals = RawMaterial::whereNull('branch_id')->get();
            /** @var RawMaterial $global */
            foreach ($globals as $global) {
                $clone = $global->replicate();
                $clone->branch_id = $branch->id;
                $clone->parent_id = $global->id;
                $clone->current_stock = 0;
                $clone->save();
            }

            return response()->json([
                'success' => true,
                'data'    => $branch,
                'message' => 'Branch created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create branch',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/{id}
     */
    public function show($id)
    {
        try {
            $branch = Branch::withCount('users as staff_count')
                ->with(['manager:id,name,branch_id,role'])
                ->findOrFail($id);

            $data = array_merge($branch->toArray(), [
                'manager_name' => $branch->manager?->name ?? '—',
                'staff_count'  => $branch->staff_count ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'data'    => $data,
                'message' => 'Branch retrieved successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Branch not found',
                'error'   => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * PUT /api/branches/{id}
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name'           => 'sometimes|required|string|max:255|unique:branches,name,' . $id,
            'location'       => 'sometimes|required|string|max:255',
            'status'         => 'sometimes|required|in:active,inactive',
            'ownership_type' => 'sometimes|required|in:company,franchise',
            'vat_type'       => 'sometimes|required|in:vat,non_vat',
            'kiosk_pin'      => 'sometimes|nullable|string|min:4|max:10',
            'kiosk_password' => 'sometimes|nullable|string|min:4|max:255',
            'latitude'       => 'sometimes|nullable|string',
            'longitude'      => 'sometimes|nullable|string',
            'image'          => 'sometimes|nullable|image|max:2048',
            'manager_id'     => 'sometimes|nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();
            // Security: Branch Managers can only update their own branch
            if ($user->role === 'branch_manager' && $user->branch_id != $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. You can only update your own branch settings.'
                ], 403);
            }

            $branch  = Branch::findOrFail($id);
            $oldName = $branch->name;

            $updateData = $request->only([
                'name', 'location', 'status', 'ownership_type', 'vat_type',
                'brand', 'company_name', 'store_address', 'vat_reg_tin',
                'min_number', 'serial_number', 'owner_name', 'kiosk_pin',
                'kiosk_password', 'latitude', 'longitude'
            ]);

            if ($request->hasFile('image')) {
                // Delete old image if desired: 
                // if ($branch->image) { \Storage::disk('public')->delete($branch->image); }
                $updateData['image'] = $request->file('image')->store('branches', 'public');
            }

            $branch->update($updateData);

            if ($request->has('manager_id')) {
                // Clear branch_id for any user currently assigned as manager to this branch
                \App\Models\User::where('branch_id', $branch->id)
                    ->where('role', 'branch_manager')
                    ->update([
                        'branch_id'   => null,
                        'branch_name' => null
                    ]);

                if ($request->manager_id) {
                    \App\Models\User::where('id', $request->manager_id)
                        ->update([
                            'branch_id'   => $branch->id,
                            'branch_name' => $branch->name
                        ]);
                }
            }

            // Sync users.branch_name whenever branch name changes
            if ($request->has('name') && $oldName !== $branch->name) {
                DB::table('users')
                    ->where('branch_id', $branch->id)
                    ->update(['branch_name' => $branch->name]);
            }

            AuditHelper::log('branch', "Updated branch: {$branch->name}");

            $fresh = Branch::withCount('users as staff_count')
                ->with(['manager:id,name,branch_id,role'])
                ->findOrFail($id);

            $data = array_merge($fresh->toArray(), [
                'manager_name' => $fresh->manager?->name ?? '—',
                'staff_count'  => $fresh->staff_count ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'data'    => $data,
                'message' => 'Branch updated successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update branch',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/branches/{id}
     */
    public function destroy($id)
    {
        try {
            $branch = Branch::findOrFail($id);

            DB::transaction(function() use ($branch) {
                // Soft delete ancillary records
                RawMaterial::where('branch_id', $branch->id)->delete();
                
                AuditHelper::log('branch', "Soft deleted branch: {$branch->name}");
                $branch->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Branch marked as deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete branch',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/branches/{id}/reset-sales
     */
    public function resetSales($id)
    {
        try {
            $branch = Branch::withTrashed()->findOrFail($id);

            DB::transaction(function() use ($branch) {
                $saleIds = Sale::where('branch_id', $branch->id)->pluck('id');

                // 1. Delete dependent sale data
                SaleItem::whereIn('sale_id', $saleIds)->delete();
                Receipt::whereIn('sale_id', $saleIds)->delete();
                StockDeduction::whereIn('sale_id', $saleIds)->delete();
                
                // 2. Delete sales themselves
                Sale::where('branch_id', $branch->id)->delete();
                
                // 3. Delete cash counts and Z-readings
                CashCount::where('branch_id', $branch->id)->delete();
                ZReading::where('branch_id', $branch->id)->delete();

                // 4. Reset branch counters
                $branch->update([
                    'total_sales' => 0.00,
                    'today_sales' => 0.00,
                ]);

                AuditHelper::log('branch', "RESET ALL SALES for branch: {$branch->name}");
            });

            return response()->json([
                'success' => true,
                'message' => 'All sales records for this branch have been permanently deleted and counters reset.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset sales.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/performance
     */
    public function performance()
    {
        try {
            $data = DB::table('branch_performance')->get();

            return response()->json([
                'success' => true,
                'data'    => $data,
                'message' => 'Branch performance retrieved successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve branch performance',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/today-sales
     */
    public function todaySales()
    {
        try {
            $data = DB::table('today_sales_by_branch')->get();

            return response()->json([
                'success' => true,
                'data'    => $data,
                'message' => "Today's sales retrieved successfully",
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Failed to retrieve today's sales",
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/{id}/daily-sales
     */
    public function dailySales($id)
    {
        try {
            $data = DB::table('daily_sales_by_branch')
                ->where('branch_id', $id)
                ->orderBy('sale_date', 'desc')
                ->limit(30)
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $data,
                'message' => 'Daily sales retrieved successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve daily sales',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/branches/{id}/refresh-totals
     */
    public function refreshTotals($id)
    {
        try {
            DB::statement('CALL update_branch_totals(?)', [$id]);
            $branch = Branch::findOrFail($id);

            return response()->json([
                'success' => true,
                'data'    => $branch,
                'message' => 'Branch totals refreshed successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh branch totals',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/{id}/sales-summary
     */
    public function salesSummary($id)
    {
        try {
            $branch = Branch::findOrFail($id);

            $summary = [
                'branch_id'             => $branch->id,
                'branch_name'           => $branch->name,
                'location'              => $branch->location,
                'status'                => $branch->status,
                'total_sales'           => (float) $branch->total_sales,
                'today_sales'           => (float) $branch->today_sales,
                'transactions_today'    => $branch->sales()->whereDate('created_at', today())->count(),
                'total_transactions'    => $branch->sales()->count(),
                'avg_transaction_value' => (float) ($branch->sales()->avg('total_amount') ?? 0),
                'payment_methods'       => $branch->sales()
                    ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total'))
                    ->groupBy('payment_method')
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data'    => $summary,
                'message' => 'Branch sales summary retrieved successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales summary',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/{id}/analytics
     */
    public function analytics($id)
    {
        try {
            $branch    = Branch::findOrFail($id);
            $today     = Carbon::today();
            $weekStart = Carbon::today()->subDays(6)->startOfDay();

            // ── Weekly sales (last 7 days) ───────────────────────────────────
            $weeklyRaw = DB::table('sales')
                ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as count')
                ->where('branch_id', $id)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$weekStart, Carbon::now()])
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            $weeklySales = [];
            for ($i = 6; $i >= 0; $i--) {
                $date          = Carbon::today()->subDays($i);
                $key           = $date->toDateString();
                $weeklySales[] = [
                    'date'      => $key,
                    'day_label' => $date->format('D'),
                    'total'     => isset($weeklyRaw[$key]) ? (float) $weeklyRaw[$key]->total : 0,
                    'count'     => isset($weeklyRaw[$key]) ? (int)   $weeklyRaw[$key]->count : 0,
                ];
            }

            // ── Today's hourly breakdown ─────────────────────────────────────
            $hourlyRaw = DB::table('sales')
                ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total, COUNT(*) as count')
                ->where('branch_id', $id)
                ->where('status', 'completed')
                ->whereDate('created_at', $today)
                ->groupByRaw('HOUR(created_at)')
                ->orderBy('hour')
                ->get()
                ->keyBy('hour');

            $todayHourly = [];
            for ($h = 8; $h <= 22; $h++) {
                $label = $h < 12
                    ? "{$h} AM"
                    : ($h === 12 ? '12 PM' : (($h - 12) . ' PM'));

                $todayHourly[] = [
                    'hour'  => $h,
                    'label' => $label,
                    'total' => isset($hourlyRaw[$h]) ? (float) $hourlyRaw[$h]->total : 0,
                    'count' => isset($hourlyRaw[$h]) ? (int)   $hourlyRaw[$h]->count : 0,
                ];
            }

            $weeklyTotal = collect($weeklySales)->sum('total');
            $todayTotal  = collect($todayHourly)->sum('total');
            $txCount     = collect($weeklySales)->sum('count');
            $avgOrder    = $txCount > 0 ? $weeklyTotal / $txCount : 0;

            return response()->json([
                'success' => true,
                'data'    => [
                    'branch_id'          => (int) $id,
                    'weekly_sales'       => $weeklySales,
                    'today_hourly'       => $todayHourly,
                    'weekly_total'       => round($weeklyTotal, 2),
                    'today_total'        => round($todayTotal,  2),
                    'avg_order_value'    => round($avgOrder,    2),
                    'total_transactions' => (int) $txCount,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load analytics',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/branches/ownership-summary
     */
    public function ownershipSummary(Request $request)
    {
        try {
            $period   = $request->query('period', 'monthly');
            $branches = Branch::all()->groupBy('ownership_type');

            $getStats = function ($group) use ($period) {
                $ids   = $group->pluck('id');
                $query = DB::table('sales')->whereIn('branch_id', $ids);

                // Apply period filter
                if ($period === 'daily') {
                    $query->whereDate('created_at', today());
                } elseif ($period === 'weekly') {
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                } elseif ($period === 'monthly') {
                    $query->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year);
                }

                $result = (clone $query)->where('status', 'completed')
                    ->selectRaw('COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue')
                    ->first();

                $voided = (clone $query)->where('status', 'cancelled')
                    ->selectRaw('COALESCE(SUM(total_amount), 0) as voided_revenue')
                    ->first();

                return [
                    'branch_count'   => $group->count(),
                    'total_orders'   => (int)   ($result->total_orders  ?? 0),
                    'total_revenue'  => (float) ($result->total_revenue ?? 0),
                    'voided_revenue' => (float) ($voided->voided_revenue ?? 0),
                ];
            };

            return response()->json([
                'success'   => true,
                'company'   => $getStats($branches->get('company',  collect())),
                'franchise' => $getStats($branches->get('franchise', collect())),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}