<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StockUpdateRequest;
use App\Models\MenuItem;
use App\Models\StockTransaction;
use App\Repositories\InventoryRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class InventoryController extends Controller
{
    protected InventoryRepositoryInterface $inventoryRepository;

    public function __construct(InventoryRepositoryInterface $inventoryRepository)
    {
        $this->inventoryRepository = $inventoryRepository;
    }

    /**
     * Get all items for the inventory list from menu_items.
     * (Accessible by branch managers but filtered if necessary in future)
     */
    public function index()
    {
        try {
            $items = MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
                ->select(
                    'menu_items.id', 
                    'menu_items.name', 
                    'menu_items.barcode', 
                    'menu_items.quantity'
                )
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

    public function updateQuantity(StockUpdateRequest $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $result = $this->inventoryRepository->updateStock($id, $request->quantity);
                return response()->json($result);
            });
        } catch (AccessDeniedHttpException $e) {
            return response()->json(['error' => $e->getMessage()], 403);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function getStockAlerts()
    {
        try {
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
            $categories = \App\Models\Category::select('id', 'name')
                ->where('type', '!=', 'standard')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json($categories);
        } catch (\Exception $e) {
            Log::error("Fetch Categories Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to load valid categories'], 500);
        }
    }

    public function checkByBarcode($barcode)
    {
        try {
            $item = $this->inventoryRepository->checkByBarcode($barcode);

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
            $history = $this->inventoryRepository->getTransactionHistory();
            return response()->json($history);
        } catch (\Exception $e) {
            Log::error("Fetch History Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch transaction history'], 500);
        }
    }

    public function overview(Request $request)
    {
        try {
            $overview = $this->inventoryRepository->getOverview($request->query());
            return response()->json($overview);
        } catch (\Exception $e) {
            Log::error('Inventory overview error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load overview.'], 500);
        }
    }

    public function alerts(Request $request)
    {
        try {
            $alerts = $this->inventoryRepository->getAlerts($request->query());
            return response()->json($alerts);
        } catch (\Exception $e) {
            Log::error('Inventory alerts error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load alerts.'], 500);
        }
    }

    public function usageReport(Request $request)
    {
        try {
            $period = $request->query('period', now()->format('Y-m'));
            $report = $this->inventoryRepository->getUsageReport($period, $request->query());
            
            return response()->json($report);
        } catch (\Exception $e) {
            Log::error('Usage report error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to generate usage report.'], 500);
        }
    }

    public function usageBreakdown(Request $request, int $id)
    {
        try {
            $period = $request->query('period', now()->format('Y-m'));
            $data = $this->inventoryRepository->getUsageBreakdown($id, $period, $request->query());
            
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Usage breakdown error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load breakdown.'], 500);
        }
    }

    public function exportUsageReport(Request $request)
    {
        try {
            $period = $request->query('period', now()->format('Y-m'));
            // Fetch via repo to avoid full internal HTTP request cycle overhead
            $data = $this->inventoryRepository->getUsageReport($period, $request->query());

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