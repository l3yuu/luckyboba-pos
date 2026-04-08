<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\RawMaterial;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class InventoryAlertController extends Controller
{
    /**
     * Get aggregated inventory alerts across all branches.
     */
    public function index(Request $request)
    {
        try {
            $rawMaterialAlerts = $this->getRawMaterialAlerts();
            $menuItemAlerts = $this->getMenuItemAlerts();

            $allAlerts = $rawMaterialAlerts->concat($menuItemAlerts);
            $branches = Branch::all()->keyBy('id');
            
            $grouped = $allAlerts->groupBy('branch_id')->map(function ($alerts, $branchId) use ($branches) {
                $branch = $branches->get($branchId);
                return [
                    'branch_id' => $branchId,
                    'branch_name' => $branch ? $branch->name : 'Unknown Branch',
                    'alert_count' => $alerts->count(),
                    'critical_count' => $alerts->where('severity', 'critical')->count(),
                    'items' => $alerts->values()
                ];
            })->values();

            return response()->json([
                'success' => true,
                'summary' => [
                    'total_alerts' => $allAlerts->count(),
                    'critical_total' => $allAlerts->where('severity', 'critical')->count(),
                    'affected_branches' => $grouped->count()
                ],
                'data' => $grouped
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load inventory alerts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch and format alerts for raw materials.
     */
    private function getRawMaterialAlerts(): Collection
    {
        return RawMaterial::whereRaw('current_stock <= reorder_level')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'type' => 'raw_material',
                    'category' => $item->category,
                    'unit' => $item->unit,
                    'current_stock' => (float) $item->current_stock,
                    'reorder_level' => (float) $item->reorder_level,
                    'branch_id' => $item->branch_id,
                    'status' => $item->current_stock <= 0 ? 'out_of_stock' : 'low_stock',
                    'severity' => $item->current_stock <= ($item->reorder_level * 0.3) ? 'critical' : 'warning'
                ];
            });
    }

    /**
     * Fetch and format alerts for menu items.
     */
    private function getMenuItemAlerts(): Collection
    {
        return MenuItem::join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select('menu_items.*', 'categories.name as category_name')
            ->where('categories.type', '!=', 'standard')
            ->where('menu_items.quantity', '<=', 10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'type' => 'product',
                    'category' => $item->category_name,
                    'unit' => 'PC',
                    'current_stock' => (float) $item->quantity,
                    'reorder_level' => 10,
                    'branch_id' => $item->branch_id,
                    'status' => $item->quantity <= 0 ? 'out_of_stock' : 'low_stock',
                    'severity' => $item->quantity <= 3 ? 'critical' : 'warning'
                ];
            });
    }
}
