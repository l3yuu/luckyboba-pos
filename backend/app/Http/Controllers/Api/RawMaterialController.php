<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use App\Models\RawMaterialLog;
use App\Models\StockMovement;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RawMaterialController extends Controller
{
    private function branchAwareQuery(?int $branchId)
    {
        $query = RawMaterial::query();

        if (!$branchId) {
            return $query->whereNull('branch_id');
        }

        return $query->where(function ($q) use ($branchId) {
            $q->where('branch_id', $branchId)
                ->orWhere(function ($globalQ) use ($branchId) {
                    $globalQ->whereNull('branch_id')
                        ->whereNotExists(function ($sub) use ($branchId) {
                            $sub->select(DB::raw(1))
                                ->from('raw_materials as branch_materials')
                                ->where('branch_materials.branch_id', $branchId)
                                ->where(function ($match) {
                                    $match->whereColumn('branch_materials.parent_id', 'raw_materials.id')
                                        ->orWhereColumn('branch_materials.name', 'raw_materials.name');
                                });
                        });
                });
        });
    }

    /**
     * GET /api/raw-materials
     * List all raw materials with low-stock flag.
     */
    public function index(Request $request)
    {
        $query = $this->branchAwareQuery($request->integer('branch_id'));

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'reorder_level');
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $materials = $query->with('branchStocks.branch')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        // ✅ Multi-day Trend Calculation (Last 7 Days)
        $sevenDaysAgo = now()->subDays(7)->startOfDay();
        $movementsSet = StockMovement::whereIn('raw_material_id', $materials->pluck('id'))
            ->where('created_at', '>=', $sevenDaysAgo)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('raw_material_id');

        $materials->each(function ($m) use ($movementsSet) {
            $history = [];
            $current = (float)$m->current_stock;
            $movements = $movementsSet->get($m->id, collect());

            // We want stock at end of each day: [6_days_ago, 5_ago, ..., today]
            for ($i = 0; $i <= 7; $i++) {
                $history[] = round($current, 2);
                $cutoff = now()->subDays($i)->startOfDay();

                // Movements that happened BETWEEN [cutoff] and [now]
                // We basically "undo" these movements to find the previous state
                foreach ($movements as $idx => $mov) {
                    if ($mov->created_at >= $cutoff) {
                        if ($mov->type === 'add') $current -= $mov->quantity;
                        elseif ($mov->type === 'subtract' || $mov->type === 'waste') $current += $mov->quantity;
                        elseif ($mov->type === 'set') {
                            // If it's a 'set', we can't easily go further back without previous 'set' or movements
                            // For simplicity, we assume older state was 0 if we hit a 'set' at the start of our window
                            // But usually, we just stop undoing.
                        }
                        $movements->forget($idx); // Remove handled movement
                    }
                }
            }
            $m->stock_history = array_reverse($history);
        });

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
            'notes'                     => 'nullable|string',
            'purchase_unit'             => 'nullable|string',
            'purchase_to_base_factor'   => 'nullable|numeric|min:0',
            'last_purchase_price'       => 'nullable|numeric|min:0',
            'branch_id'                 => 'nullable|exists:branches,id',
        ]);

        return DB::transaction(function() use ($validated, $request) {
            $material = RawMaterial::create($validated);

            // ✅ Log Activity
            AuditLog::create([
                'user_id'    => auth()->id(),
                'action'     => "Created Raw Material: {$material->name}",
                'module'     => 'Inventory',
                'details'    => "Category: {$material->category}, Initial Stock: {$material->current_stock} {$material->unit}",
                'ip_address' => $request->ip(),
            ]);

            // ✅ If this is a global material, auto-clone it for all existing branches
            if (empty($validated['branch_id'])) {
                $branches = \App\Models\Branch::all();
                foreach ($branches as $branch) {
                    $clone = $material->replicate();
                    $clone->branch_id = $branch->id;
                    $clone->parent_id = $material->id;
                    $clone->save();
                }
            }

            return response()->json($material, 201);
        });
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
            'notes'                     => 'nullable|string',
            'purchase_unit'             => 'sometimes|string|nullable',
            'purchase_to_base_factor'   => 'sometimes|numeric|min:0',
            'last_purchase_price'       => 'sometimes|numeric|min:0',
        ]);

        $rawMaterial->update($validated);

        // ✅ Log Activity
        AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => "Updated Raw Material: {$rawMaterial->name}",
            'module'     => 'Inventory',
            'details'    => "Updated fields: " . implode(', ', array_keys($validated)),
            'ip_address' => $request->ip(),
        ]);

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

        $materialName = $rawMaterial->name;
        $rawMaterial->delete();

        // ✅ Log Activity
        AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => "Deleted Raw Material: {$materialName}",
            'module'     => 'Inventory',
            'details'    => "Material was removed from the system.",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(['message' => 'Deleted successfully.']);
    }

    /**
     * POST /api/raw-materials/{id}/adjust
     * Manual stock adjustment — also writes to stock_movements for Usage Report.
     */
    public function adjust(Request $request, RawMaterial $rawMaterial)
    {
        $validated = $request->validate([
            'type'     => 'required|in:add,subtract,set,waste',
            'quantity' => 'required|numeric|min:0',
            'reason'   => 'nullable|string',
        ]);

        $user = auth()->user();
        if (in_array($user->role, ['branch_manager', 'team_leader']) && $rawMaterial->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized: This material belongs to another branch.'], 403);
        }

        try {
            DB::transaction(function () use ($validated, $rawMaterial) {
                $type = $validated['type'];
                $qty  = (float) $validated['quantity'];
                $reason = $validated['reason'] ?? ucfirst($type) . ' (manual)';

                if ($type === 'set') {
                    $before = (float) $rawMaterial->current_stock;
                    $rawMaterial->update(['current_stock' => $qty]);
                    $after = $qty;

                    StockMovement::create([
                        'raw_material_id' => $rawMaterial->id,
                        'branch_id'       => $rawMaterial->branch_id,
                        'user_id'         => auth()->id(),
                        'before_stock'    => $before,
                        'after_stock'     => $after,
                        'type'            => 'set',
                        'quantity'        => $qty,
                        'reason'          => $reason,
                    ]);
                } else {
                    $rawMaterial->recordMovement($qty, $type, $reason);
                }

                // ✅ Log Activity
                AuditLog::create([
                    'user_id'    => auth()->id(),
                    'action'     => "Manual Stock Adjustment",
                    'module'     => 'Inventory',
                    'details'    => "Material: {$rawMaterial->name}. Type: {$type}, Qty: {$qty} {$rawMaterial->unit}. Reason: " . $reason,
                    'ip_address' => request()->ip(),
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
     * Get movement history for a material.
     */
    public function history(Request $request, RawMaterial $rawMaterial)
    {
        $user = $request->user();
        if (in_array($user->role, ['branch_manager', 'team_leader', 'supervisor']) && $rawMaterial->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized: This material belongs to another branch.'], 403);
        }

        // Use stock_movements as source of truth for "View History" in UI
        $logs = StockMovement::with(['user:id,name'])
            ->where('raw_material_id', $rawMaterial->id)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($request->integer('limit', 50))
            ->get()
            ->map(fn($m) => [
                'id'           => $m->id,
                'type'         => $m->type,
                'quantity'     => (float) $m->quantity,
                'before'       => $m->before_stock !== null ? (float)$m->before_stock : null,
                'after'        => $m->after_stock !== null ? (float)$m->after_stock : null,
                'reason'       => $m->reason ?? ucfirst($m->type),
                'performed_by' => $m->user->name ?? 'System',
                'created_at'   => $m->created_at,
            ]);

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
        $query = StockMovement::with(['rawMaterial:id,name,unit', 'branch:id,name', 'user:id,name']);
        
        $branchId = $request->query('branch_id');
        $selectedBranchName = $branchId ? \App\Models\Branch::find($branchId)?->name : null;

        if ($branchId) {
            // Strict filtering for movements: only show results for the selected branch
            $query->where('branch_id', $branchId);
        }

        if ($request->filled('period')) {
            $query->where('created_at', 'like', $request->period . '%');
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
                'before'       => $m->before_stock !== null ? (float)$m->before_stock : null,
                'after'        => $m->after_stock !== null ? (float)$m->after_stock : null,
                'unit'         => $m->rawMaterial->unit ?? '',
                'branch_name'  => $m->branch->name ?? ($selectedBranchName ?? 'Main Office'),
                'reason'       => $m->reason,
                'performed_by' => $m->user->name ?? 'System', 
                'created_at'   => $m->created_at,
            ]);

        return response()->json($movements);
    }

    /**
     * POST /api/raw-materials/bulk-audit
     * Bulk physical count audit.
     */
    public function bulkAudit(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:raw_materials,id',
            'items.*.beg' => 'nullable|numeric|min:0',
            'items.*.actual' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string',
        ]);

        $user = $request->user();
        $reason = $validated['reason'] ?? 'Physical Count Audit';

        try {
            return DB::transaction(function () use ($validated, $user, $reason) {
                foreach ($validated['items'] as $auditItem) {
                    $material = RawMaterial::findOrFail($auditItem['id']);

                    // Branch Isolation Check
                    if (in_array($user->role, ['branch_manager', 'team_leader']) && $material->branch_id !== $user->branch_id) {
                        continue; // Skip items from other branches
                    }

                    $oldStock = $material->current_stock;
                    
                    // 1. Check for manual BEG (Opening) adjust
                    if (isset($auditItem['beg'])) {
                        $begValue = $auditItem['beg'];
                        
                        // To make this "BEG" permanent in the report, we must update current_stock
                        // Formula: New Current Stock = New BEG + (Movements since start of today)
                        $todayStart = now()->startOfDay();
                        $todayAdditions = StockMovement::where('raw_material_id', $material->id)
                            ->where('created_at', '>=', $todayStart)
                            ->where('type', 'add')
                            ->sum('quantity');
                        $todaySubtractions = StockMovement::where('raw_material_id', $material->id)
                            ->where('created_at', '>=', $todayStart)
                            ->where('type', 'subtract')
                            ->sum('quantity');

                        $before = (float) $material->current_stock;
                        $material->current_stock = $begValue + $todayAdditions - $todaySubtractions;
                        $material->save();
                        $after = (float) $material->current_stock;

                        // Record a movement at the very start of today (00:00:01)
                        StockMovement::create([
                            'raw_material_id' => $material->id,
                            'branch_id'       => $material->branch_id,
                            'user_id'         => auth()->id(),
                            'before_stock'    => $before,
                            'after_stock'     => $after,
                            'type'            => 'set',
                            'quantity'        => $begValue,
                            'reason'          => 'Manual Opening Adjustment',
                            'created_at'      => $todayStart->copy()->addSecond(),
                        ]);
                    }

                    // 2. Update current inventory if 'actual' (Closing) is provided
                    if (isset($auditItem['actual'])) {
                        $actual = (float) $auditItem['actual'];
                        $before = (float) $material->current_stock;
                        
                        $material->update(['current_stock' => $actual]);
                        $after = $actual;

                        StockMovement::create([
                            'raw_material_id' => $material->id,
                            'branch_id'       => $material->branch_id,
                            'user_id'         => auth()->id(),
                            'before_stock'    => $before,
                            'after_stock'     => $after,
                            'type'            => 'set',
                            'quantity'        => $actual,
                            'reason'          => $reason . " (Prev: " . round($before, 2) . ")",
                        ]);
                    }
                }

                // ✅ Log Activity
                AuditLog::create([
                    'user_id'    => $user->id,
                    'action'     => "Bulk Physical Count Audit",
                    'module'     => 'Usage Report',
                    'details'    => "Submitted physical counts for " . count($validated['items']) . " materials. Reason: " . $reason,
                    'ip_address' => request()->ip(),
                ]);

                return response()->json(['message' => 'Bulk inventory audit completed successfully.']);
            });
        } catch (\Exception $e) {
            Log::error('Bulk Audit Error: ' . $e->getMessage());
            return response()->json(['message' => 'Audit failed.'], 500);
        }
    }
}