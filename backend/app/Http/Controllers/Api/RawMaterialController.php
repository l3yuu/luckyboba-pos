<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use App\Models\RawMaterialLog;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RawMaterialController extends Controller
{
    /**
     * GET /api/raw-materials
     * List all raw materials with low-stock flag.
     */
    public function index(Request $request)
    {
        $query = RawMaterial::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'reorder_level');
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $materials = $query->orderBy('category')->orderBy('name')->get();

        return response()->json($materials);
    }

    /**
     * GET /api/raw-materials/{id}
     * Show single raw material with recent logs.
     */
    public function show(RawMaterial $rawMaterial)
    {
        $rawMaterial->load([
            'logs' => fn($q) => $q->orderBy('date', 'desc')->limit(30)
        ]);

        return response()->json($rawMaterial);
    }

    /**
     * POST /api/raw-materials
     * Create a new raw material.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|unique:raw_materials,name',
            'unit'            => 'required|string',
            'category'        => 'required|string',
            'current_stock'   => 'nullable|numeric|min:0',
            'reorder_level'   => 'nullable|numeric|min:0',
            'is_intermediate' => 'nullable|boolean',
            'notes'           => 'nullable|string',
        ]);

        $material = RawMaterial::create($validated);

        return response()->json($material, 201);
    }

    /**
     * PATCH /api/raw-materials/{id}
     * Update raw material details (not stock — use adjust for that).
     */
    public function update(Request $request, RawMaterial $rawMaterial)
    {
        $validated = $request->validate([
            'name'            => 'sometimes|string|unique:raw_materials,name,' . $rawMaterial->id,
            'unit'            => 'sometimes|string',
            'category'        => 'sometimes|string',
            'reorder_level'   => 'sometimes|numeric|min:0',
            'is_intermediate' => 'sometimes|boolean',
            'notes'           => 'nullable|string',
        ]);

        $rawMaterial->update($validated);

        return response()->json($rawMaterial);
    }

    /**
     * DELETE /api/raw-materials/{id}
     */
    public function destroy(RawMaterial $rawMaterial)
    {
        if ($rawMaterial->recipeItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete: this material is used in ' .
                             $rawMaterial->recipeItems()->count() . ' recipe(s).'
            ], 422);
        }

        $rawMaterial->delete();

        return response()->json(['message' => 'Deleted successfully.']);
    }

    /**
     * POST /api/raw-materials/{id}/adjust
     * Manual stock adjustment — also writes to stock_movements for Usage Report.
     */
    public function adjust(Request $request, RawMaterial $rawMaterial)
    {
        $validated = $request->validate([
            'type'     => 'required|in:add,subtract,set',
            'quantity' => 'required|numeric|min:0',
            'reason'   => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated, $rawMaterial) {
                switch ($validated['type']) {
                    case 'add':
                        $rawMaterial->increment('current_stock', $validated['quantity']);
                        break;
                    case 'subtract':
                        $rawMaterial->decrement('current_stock', $validated['quantity']);
                        break;
                    case 'set':
                        $rawMaterial->update(['current_stock' => $validated['quantity']]);
                        break;
                }

                // Record in stock_movements so Usage Report reflects manual adjustments
                StockMovement::create([
                    'raw_material_id' => $rawMaterial->id,
                    'type'            => $validated['type'],
                    'quantity'        => $validated['quantity'],
                    'reason'          => $validated['reason'] ?? ucfirst($validated['type']) . ' (manual)',
                ]);
            });

            $rawMaterial->refresh();

            return response()->json([
                'message'       => 'Stock adjusted successfully.',
                'current_stock' => $rawMaterial->current_stock,
            ]);

        } catch (\Exception $e) {
            Log::error('RawMaterial adjust error: ' . $e->getMessage());
            return response()->json(['message' => 'Adjustment failed.'], 500);
        }
    }

    /**
     * GET /api/raw-materials/{id}/history
     * Get daily log history for a material.
     */
    public function history(Request $request, RawMaterial $rawMaterial)
    {
        $logs = RawMaterialLog::where('raw_material_id', $rawMaterial->id)
            ->orderBy('date', 'desc')
            ->limit($request->integer('limit', 30))
            ->get();

        return response()->json([
            'material' => $rawMaterial,
            'logs'     => $logs,
        ]);
    }

    /**
     * GET /api/raw-materials/low-stock
     * Quick endpoint for the dashboard alert widget.
     */
    public function lowStock()
    {
        $items = RawMaterial::whereColumn('current_stock', '<=', 'reorder_level')
            ->where('reorder_level', '>', 0)
            ->orderBy('current_stock')
            ->get();

        return response()->json([
            'count' => $items->count(),
            'items' => $items,
        ]);
    }

    /**
     * GET /api/raw-materials/movements
     * Stock movement log across all raw materials.
     * Used by the Inventory Dashboard Usage Report tab.
     */
    public function movements(Request $request)
    {
        $query = StockMovement::with(['rawMaterial:id,name,unit', 'branch:id,name']);

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('raw_material_id')) {
            $query->where('raw_material_id', $request->raw_material_id);
        }

        $movements = $query->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($request->integer('limit', 50))
            ->get()
            ->map(fn($m) => [
                'id'           => $m->id,
                'raw_material' => $m->rawMaterial->name ?? 'Unknown',
                'type'         => $m->type,
                'quantity'     => $m->quantity,
                'unit'         => $m->rawMaterial->unit ?? '',
                'branch_name'  => $m->branch->name ?? 'Main Office',
                'reason'       => $m->reason,
                'performed_by' => 'System', 
                'created_at'   => $m->created_at,
            ]);

        return response()->json($movements);
    }
}