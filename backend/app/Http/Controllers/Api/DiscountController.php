<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiscountController extends Controller
{
    // ── List ───────────────────────────────────────────────────────────────────

    public function index()
    {
        $discounts = Discount::with('branches:id,name')
                             ->orderBy('created_at', 'desc')
                             ->get();

        return response()->json($discounts);
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'amount'     => 'required|numeric|min:0',
            'type'       => 'required|string',
            'status'     => 'required|in:ON,OFF',
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        $discount = Discount::create([
            'name'       => $validated['name'],
            'amount'     => $validated['amount'],
            'type'       => $validated['type'],
            'status'     => $validated['status'],
            'used_count' => 0,
        ]);

        // Attach branches if provided (empty array = all branches)
        if (!empty($validated['branch_ids'])) {
            $discount->branches()->sync($validated['branch_ids']);
        }

        $discount->load('branches:id,name');

        AuditLog::create([
            'user_id'    => Auth::id(),
            'action'     => "Created discount: {$discount->name}",
            'module'     => 'Discounts',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($discount, 201);
    }

    // ── Update branches ────────────────────────────────────────────────────────

    public function updateBranches(Request $request, Discount $discount)
    {
        $validated = $request->validate([
            'branch_ids'   => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        $discount->branches()->sync($validated['branch_ids']);
        $discount->load('branches:id,name');

        AuditLog::create([
            'user_id'    => Auth::id(),
            'action'     => "Updated branches for discount: {$discount->name}",
            'module'     => 'Discounts',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($discount);
    }

    // ── Toggle status ──────────────────────────────────────────────────────────

    public function toggleStatus(Discount $discount)
    {
        try {
            $oldStatus       = $discount->status;
            $discount->status = ($oldStatus === 'ON') ? 'OFF' : 'ON';
            $discount->save();

            $discount->load('branches:id,name');

            AuditLog::create([
                'user_id'    => Auth::id(),
                'action'     => "Changed {$discount->name} status from {$oldStatus} to {$discount->status}",
                'module'     => 'Discounts',
                'ip_address' => request()->ip(),
            ]);

            return response()->json($discount);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    public function destroy(Discount $discount)
    {
        try {
            $discountName = $discount->name;

            // Pivot rows are removed automatically via cascadeOnDelete on the migration.
            $discount->delete();

            AuditLog::create([
                'user_id'    => Auth::id(),
                'action'     => "Deleted discount: {$discountName}",
                'module'     => 'Discounts',
                'ip_address' => request()->ip(),
            ]);

            return response()->json(['message' => 'Deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── Record usage (call from Order/Sale controller) ─────────────────────────

    /**
     * POST /api/discounts/{discount}/use
     * Call this whenever a discount is applied to an order.
     */
    public function recordUsage(Discount $discount)
    {
        if ($discount->status !== 'ON') {
            return response()->json(['error' => 'Discount is not active.'], 422);
        }

        $discount->recordUsage();
        $discount->load('branches:id,name');

        return response()->json($discount);
    }
}