<?php

namespace App\Repositories;

use App\Models\MenuItem;
use App\Models\StockTransaction;
use App\Models\Branch;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class InventoryRepository implements InventoryRepositoryInterface
{
    /**
     * Get isolated branch ID if the user is a branch manager.
     */
    private function getScopedBranchId(?int $requestedBranchId = null): ?int
    {
        $authUser = Auth::user();
        if ($authUser && $authUser->role === 'branch_manager') {
            return $authUser->branch_id;
        }
        return $requestedBranchId;
    }

    public function getOverview(array $filters = []): array
    {
        $branchId = $this->getScopedBranchId($filters['branch_id'] ?? null);

        $baseQuery = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->where('categories.type', '!=', 'standard');

        if ($branchId) {
            $baseQuery->where('menu_items.branch_id', $branchId);
        }

        $totalItems  = (clone $baseQuery)->count();
        $lowStock    = (clone $baseQuery)->where('menu_items.quantity', '>', 0)->where('menu_items.quantity', '<=', 5)->count();
        $outOfStock  = (clone $baseQuery)->where('menu_items.quantity', '<=', 0)->count();

        // Pending POs
        $pendingPos = 0;
        try { 
            // In future, also scope POs by branchId here
            $poQuery = \App\Models\PurchaseOrder::whereIn('status', ['Draft', 'Approved', 'Pending']);
            $pendingPos = $poQuery->count(); 
        } catch (\Exception $e) {}

        // Branch Summary calculation
        $branchSummary = [];
        try {
            // Only output branch summary if not scoped to a single branch (or if branch_manager, just their own)
            $branches = $branchId ? Branch::where('id', $branchId)->get() : Branch::all();
            
            $branchSummary = $branches->map(function ($branch) {
                $bStats = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
                    ->where('categories.type', '!=', 'standard')
                    ->where('menu_items.branch_id', $branch->id)
                    ->selectRaw('
                        COUNT(*) as total,
                        SUM(CASE WHEN menu_items.quantity > 0 AND menu_items.quantity <= 5 THEN 1 ELSE 0 END) as low,
                        SUM(CASE WHEN menu_items.quantity <= 0 THEN 1 ELSE 0 END) as out_of
                    ')->first();

                $total = $bStats->total ?? 0;
                $low   = $bStats->low   ?? 0;
                $out   = $bStats->out_of ?? 0;
                
                $health = $total > 0 ? round((($total - ($low + $out)) / $total) * 100) : 100;

                return [
                    'branch_id'    => $branch->id,
                    'branch_name'  => $branch->name,
                    'total_items'  => $total,
                    'low_stock'    => $low,
                    'out_of_stock' => $out,
                    'pending_pos'  => 0, 
                    'health_pct'   => $health,
                ];
            });
        } catch (\Exception $e) {}

        return [
            'total_items'    => $totalItems,
            'low_stock'      => $lowStock,
            'out_of_stock'   => $outOfStock,
            'pending_pos'    => $pendingPos,
            'branch_summary' => $branchSummary,
        ];
    }

    public function getAlerts(array $filters = []): Collection
    {
        $branchId = $this->getScopedBranchId($filters['branch_id'] ?? null);
        $selectedBranchName = $branchId ? Branch::find($branchId)?->name : null;

        $query = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('branches', 'menu_items.branch_id', '=', 'branches.id')
            ->select(
                'menu_items.id', 
                'menu_items.name', 
                'menu_items.quantity', 
                'categories.name as category',
                'branches.name as branch_name'
            )
            ->where('categories.type', '!=', 'standard')
            ->where('menu_items.quantity', '<=', 5);

        if ($branchId) {
            $query->where('menu_items.branch_id', $branchId);
        }

        return $query->orderBy('menu_items.quantity', 'asc')
            ->get()
            ->map(fn($item) => [
                'id'            => $item->id,
                'name'          => $item->name,
                'category'      => $item->category,
                'unit'          => 'PC',
                'current_stock' => $item->quantity,
                'reorder_level' => 5,
                'branch_name'   => $item->branch_name ?? ($selectedBranchName ?? 'Main Office'),
                'status'        => $item->quantity <= 0 ? 'out_of_stock'
                                 : ($item->quantity <= 2  ? 'critical' : 'low'),
            ]);
    }

    public function getUsageReport(string $period, array $filters = []): Collection
    {
        $branchId = $this->getScopedBranchId($filters['branch_id'] ?? null);

        $parts = explode('-', $period);
        if (count($parts) === 3) {
            $startDate = $period;
            $endDate   = $period;
        } else {
            $year      = $parts[0] ?? now()->format('Y');
            $month     = $parts[1] ?? now()->format('m');
            $startDate = "{$year}-{$month}-01";
            $endDate   = date('Y-m-t', strtotime($startDate));
        }

        $materialsQuery = \App\Models\RawMaterial::query();
        if ($branchId) {
            $materialsQuery->where('branch_id', $branchId);
        }
        $materials = $materialsQuery->get();

        return $materials->map(function ($mat) use ($startDate, $endDate, $branchId) {
            $movementsQuery = \App\Models\StockMovement::where('raw_material_id', $mat->id)
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            
            if ($branchId) {
                $movementsQuery->where('branch_id', $branchId);
            }

            $movements = $movementsQuery->get();

            $del    = $movements->where('type', 'add')->sum('quantity');
            $out    = $movements->where('type', 'subtract')->sum('quantity');
            $spoil  = 0; 
            $cooked = 0; 

            $end = $mat->current_stock;
            $beg = max(0, $end - $del + $out + $spoil - $cooked);

            $usage    = $out + $spoil;
            $expected = $beg + $del + $cooked - $out - $spoil;
            $variance = $end - $expected;

            return [
                'id'       => $mat->id,
                'name'     => $mat->name,
                'unit'     => $mat->unit,
                'category' => $mat->category,
                'beg'      => round($beg, 2),
                'del'      => round($del, 2),
                'cooked'   => round($cooked, 2),
                'out'      => round($out, 2),
                'spoil'    => round($spoil, 2),
                'end'      => round($end, 2),
                'usage'    => round($usage, 2),
                'variance' => round($variance, 2),
            ];
        });
    }

    public function getUsageBreakdown(int $rawMaterialId, string $period, array $filters = []): Collection
    {
        $branchId = $this->getScopedBranchId($filters['branch_id'] ?? null);

        $parts = explode('-', $period);
        if (count($parts) === 3) {
            $startDate = $period;
            $endDate   = $period;
        } else {
            $year      = $parts[0] ?? now()->format('Y');
            $month     = $parts[1] ?? now()->format('m');
            $startDate = "{$year}-{$month}-01";
            $endDate   = date('Y-m-t', strtotime($startDate));
        }

        return DB::table('stock_deductions')
            ->join('sale_items', 'stock_deductions.sale_item_id', '=', 'sale_items.id')
            ->leftJoin('recipe_items', 'stock_deductions.recipe_item_id', '=', 'recipe_items.id')
            ->select(
                'sale_items.product_name',
                'sale_items.cup_size_label',
                'recipe_items.quantity as recipe_quantity',
                DB::raw('COUNT(sale_items.id) as total_sold'),
                DB::raw('SUM(stock_deductions.quantity_deducted) as total_deducted')
            )
            ->where('stock_deductions.raw_material_id', $rawMaterialId)
            ->whereBetween('stock_deductions.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->when($branchId, fn($q) => $q->where('sale_items.branch_id', $branchId))
            ->groupBy('sale_items.product_name', 'sale_items.cup_size_label', 'recipe_items.quantity')
            ->orderBy('total_deducted', 'desc')
            ->get();
    }

    public function updateStock(int $menuItemId, int $quantityChange): array
    {
        $item = MenuItem::findOrFail($menuItemId);
        $authUser = Auth::user();

        if ($authUser->role === 'branch_manager' && $item->branch_id !== $authUser->branch_id) {
            throw new AccessDeniedHttpException('Cannot update stock for items outside your branch.');
        }

        $item->quantity += $quantityChange;
        $item->save();

        StockTransaction::create([
            'menu_item_id'    => $menuItemId,
            'quantity_change' => $quantityChange,
            'type'            => $quantityChange > 0 ? 'restock' : 'adjustment',
            'remarks'         => 'Manual restock via Inventory Dashboard'
        ]);

        return [
            'message'   => 'Stock updated and transaction logged successfully',
            'new_total' => $item->quantity
        ];
    }

    public function checkByBarcode(string $barcode)
    {
        $item = MenuItem::where('barcode', $barcode)->first();
        
        if ($item) {
            $authUser = Auth::user();
            if ($authUser->role === 'branch_manager' && $item->branch_id !== $authUser->branch_id) {
                // Return null if the barcode belongs to another branch
                return null;
            }
        }
        
        return $item;
    }

    public function getTransactionHistory(): Collection
    {
        $branchId = $this->getScopedBranchId();

        $query = DB::table('stock_transactions')
            ->join('menu_items', 'stock_transactions.menu_item_id', '=', 'menu_items.id')
            ->select(
                'stock_transactions.id',
                'menu_items.name as product_name',
                'stock_transactions.quantity_change',
                'stock_transactions.type',
                'stock_transactions.remarks',
                'stock_transactions.created_at'
            );

        if ($branchId) {
            $query->where('menu_items.branch_id', $branchId);
        }

        return $query->orderBy('stock_transactions.created_at', 'desc')->get();
    }
}
