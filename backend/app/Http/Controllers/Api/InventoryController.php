<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
/**
     * Get all items for the inventory list from menu_items.
     */
    public function index()
    {
        try {
            // Join menu_items with categories to filter by category type
            $items = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
                ->select(
                    'menu_items.id', 
                    'menu_items.name', 
                    'menu_items.barcode', 
                    'menu_items.quantity'
                )
                // Only show items where category type is 'drink', 'wings', etc.
                // Exclude 'standard' which contains non-stock items like discounts
                ->where('categories.type', '!=', 'standard') 
                ->orderBy('menu_items.name', 'asc')
                ->get();

            return response()->json($items);
        } catch (\Exception $e) {
            Log::error("Inventory Index Error: " . $e->getMessage());
            return response()->json(['error' => 'Database Error: Check Laravel logs'], 500);
        }
    }

    /**
     * Store a new item directly into menu_items.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'quantity'    => 'required|integer|min:0',
            'price'       => 'required|numeric|min:0',
            'cost'        => 'required|numeric|min:0',
            'barcode'     => 'nullable|string|unique:menu_items,barcode',
        ]);

        try {
            DB::beginTransaction();

            $item = MenuItem::create($validated);

            // Log the initial stock creation in stock_transactions
            StockTransaction::create([
                'menu_item_id'    => $item->id,
                'quantity_change' => $validated['quantity'],
                'type'            => 'restock',
                'remarks'         => 'Initial stock creation via Inventory Dashboard'
            ]);

            DB::commit();
            return response()->json($item, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Inventory Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Error creating item'], 500);
        }
    }

    public function updateQuantity(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer'
        ]);

        // Use a transaction to ensure both updates happen together
        return DB::transaction(function () use ($request, $id) {
            $item = MenuItem::findOrFail($id);
            
            // 1. Update the actual stock level in the menu_items table
            // This adds the incoming quantity (e.g., +10) to the current total
            $item->quantity += $request->quantity;
            $item->save();

            // 2. Create the audit trail in stock_transactions
            // This matches the schema shown in your database
            StockTransaction::create([
                'menu_item_id'    => $id,
                'quantity_change' => $request->quantity,
                'type'            => $request->quantity > 0 ? 'restock' : 'adjustment',
                'remarks'         => 'Manual restock via Inventory Dashboard'
            ]);

            return response()->json([
                'message'   => 'Stock updated and transaction logged successfully',
                'new_total' => $item->quantity
            ]);
        });
    }

    public function getStockAlerts()
    {
        try {
            // Fetch items that are out of stock or low (below 5)
            $alerts = MenuItem::where('quantity', '<=', 5)
                ->select('id', 'name', 'quantity')
                ->orderBy('quantity', 'asc')
                ->get();

            return response()->json([
                'count' => $alerts->count(),
                'items' => $alerts
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

public function getCategories()
{
    try {
        // Fetch categories that are not 'standard' type
        // This hides categories for discounts, cards, and freebies from your inventory forms.
        $categories = \App\Models\Category::select('id', 'name')
            ->where('type', '!=', 'standard')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($categories);
    } catch (\Exception $e) {
        \Log::error("Fetch Categories Error: " . $e->getMessage());
        return response()->json(['error' => 'Failed to load valid categories'], 500);
    }
}

    public function checkByBarcode($barcode)
    {
        try {
            $item = \App\Models\MenuItem::where('barcode', $barcode)->first();

            if (!$item) {
                return response()->json(['message' => 'Item not found'], 404);
            }

            return response()->json($item);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function getTransactionHistory()
    {
        try {
            $history = DB::table('stock_transactions')
                ->join('menu_items', 'stock_transactions.menu_item_id', '=', 'menu_items.id')
                ->select(
                    'stock_transactions.id',
                    'menu_items.name as product_name',
                    'stock_transactions.quantity_change',
                    'stock_transactions.type',
                    'stock_transactions.remarks',
                    'stock_transactions.created_at'
                )
                ->orderBy('stock_transactions.created_at', 'desc')
                ->get();

            return response()->json($history);
        } catch (\Exception $e) {
            Log::error("Fetch History Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch transaction history'], 500);
        }
    }

    public function overview(Request $request)
{
    try {
        $branchId = $request->query('branch_id');

        // Low stock = quantity <= 5 (matching your existing getStockAlerts threshold)
        $baseQuery = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->where('categories.type', '!=', 'standard');

        $totalItems  = (clone $baseQuery)->count();
        $lowStock    = (clone $baseQuery)->where('menu_items.quantity', '>', 0)->where('menu_items.quantity', '<=', 5)->count();
        $outOfStock  = (clone $baseQuery)->where('menu_items.quantity', '<=', 0)->count();

        // Pending POs — guard in case the table doesn't exist yet
        $pendingPos = 0;
        try {
            $pendingPos = \App\Models\PurchaseOrder::whereIn('status', ['Draft', 'Approved'])->count();
        } catch (\Exception $e) { /* table may not exist yet */ }

        // Branch summary — use branches table if available
        $branchSummary = [];
        try {
            $branches = \App\Models\Branch::all();
            $branchSummary = $branches->map(function ($branch) {
                // Since menu_items may not have branch_id, return global data per branch
                // You can update this once branch_id is on menu_items
                return [
                    'branch_id'    => $branch->id,
                    'branch_name'  => $branch->name,
                    'total_items'  => 0,
                    'low_stock'    => 0,
                    'out_of_stock' => 0,
                    'pending_pos'  => 0,
                    'health_pct'   => 100,
                ];
            })->values()->toArray();
        } catch (\Exception $e) { /* branches table may differ */ }

        return response()->json([
            'total_items'    => $totalItems,
            'low_stock'      => $lowStock,
            'out_of_stock'   => $outOfStock,
            'pending_pos'    => $pendingPos,
            'branch_summary' => $branchSummary,
        ]);

    } catch (\Exception $e) {
        Log::error('Inventory overview error: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to load overview.'], 500);
    }
}

public function alerts(Request $request)
{
    try {
        $alerts = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select('menu_items.id', 'menu_items.name', 'menu_items.quantity', 'categories.name as category')
            ->where('categories.type', '!=', 'standard')
            ->where('menu_items.quantity', '<=', 5)
            ->orderBy('menu_items.quantity', 'asc')
            ->get()
            ->map(fn($item) => [
                'id'            => $item->id,
                'name'          => $item->name,
                'category'      => $item->category,
                'unit'          => 'PC',
                'current_stock' => $item->quantity,
                'reorder_level' => 5,
                'branch_name'   => 'Main Branch',
                'status'        => $item->quantity <= 0 ? 'out_of_stock'
                                 : ($item->quantity <= 2  ? 'critical' : 'low'),
            ]);

        return response()->json($alerts->values());

    } catch (\Exception $e) {
        Log::error('Inventory alerts error: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to load alerts.'], 500);
    }
}
public function usageReport(Request $request)
{
    try {
        $period   = $request->query('period', now()->format('Y-m'));
        $branchId = $request->query('branch_id');

        [$year, $month] = explode('-', $period);
        $startDate = "{$year}-{$month}-01";
        $endDate   = date('Y-m-t', strtotime($startDate));

        $materials = \App\Models\RawMaterial::query()->get();

        $rows = $materials->map(function ($mat) use ($startDate, $endDate) {
            // Get all movements for this period
            $movements = \App\Models\StockMovement::where('raw_material_id', $mat->id)
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->get();

            $del    = $movements->where('type', 'add')->sum('quantity');
            $out    = $movements->where('type', 'subtract')->sum('quantity');
            $set    = $movements->where('type', 'set')->last();
            $spoil  = 0; // extend later with a spoilage type
            $cooked = 0; // extend later with an intermediate type

            // Reconstruct beginning stock
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

        return response()->json($rows->values());

    } catch (\Exception $e) {
        Log::error('Usage report error: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to generate usage report.'], 500);
    }
}

public function exportUsageReport(Request $request)
{
    try {
        $period = $request->query('period', now()->format('Y-m'));
        $data   = json_decode($this->usageReport($request)->getContent(), true);

        $csv  = "Item,Unit,Category,BEG,DEL,COOKED,OUT,SPOIL,END,USAGE,VARIANCE\n";
        foreach ($data as $row) {
            $csv .= implode(',', [
                "\"{$row['name']}\"", $row['unit'], $row['category'],
                $row['beg'], $row['del'], $row['cooked'],
                $row['out'], $row['spoil'], $row['end'],
                $row['usage'], $row['variance'],
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"usage-report-{$period}.csv\"",
        ]);

    } catch (\Exception $e) {
        Log::error('Export usage report error: ' . $e->getMessage());
        return response()->json(['message' => 'Export failed.'], 500);
    }
}
}