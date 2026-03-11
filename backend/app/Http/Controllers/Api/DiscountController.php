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

    // ── Shared validation rules ────────────────────────────────────────────────

    private function rules(Request $request, bool $isUpdate = false, int $ignoreId = 0): array
    {
        $uniqueCode = $isUpdate
            ? "unique:discounts,code,{$ignoreId}"
            : 'unique:discounts,code';

        return [
            'name'         => 'required|string|max:255',
            'code'         => "nullable|string|max:50|alpha_dash|{$uniqueCode}",
            'amount'       => 'required|numeric|min:0',
            'type'         => 'required|string|in:Global-Percent,Item-Percent,Percentage,Fixed,BOGO',
            'status'       => 'required|in:ON,OFF',
            'starts_at'    => 'nullable|date',
            'ends_at'      => ['nullable', 'date', function ($attr, $value, $fail) use ($request) {
                                $start = $request->input('starts_at');
                                if ($value && $start && $value < $start) {
                                    $fail('End date must be after or equal to start date.');
                                }
                              }],
            'branch_ids'   => 'nullable|array',
            'branch_ids.*' => 'exists:branches,id',
        ];
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules($request));

        $discount = Discount::create([
            'name'       => $validated['name'],
            'code'       => !empty($validated['code']) ? strtoupper($validated['code']) : null,
            'amount'     => $validated['amount'],
            'type'       => $validated['type'],
            'status'     => $validated['status'],
            'used_count' => 0,
            'starts_at'  => $validated['starts_at'] ?? null,
            'ends_at'    => $validated['ends_at']   ?? null,
        ]);

        if (!empty($validated['branch_ids'])) {
            $discount->branches()->sync($validated['branch_ids']);
        }

        $discount->load('branches:id,name');

        AuditLog::create([
            'user_id'    => Auth::id(),
            'action'     => "Created discount: {$discount->name}" . ($discount->code ? " ({$discount->code})" : ''),
            'module'     => 'Discounts',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($discount, 201);
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    public function update(Request $request, Discount $discount)
    {
        $validated = $request->validate($this->rules($request, isUpdate: true, ignoreId: $discount->id));

        $discount->update([
            'name'      => $validated['name'],
            'code'      => !empty($validated['code']) ? strtoupper($validated['code']) : null,
            'amount'    => $validated['amount'],
            'type'      => $validated['type'],
            'status'    => $validated['status'],
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at'   => $validated['ends_at']   ?? null,
        ]);

        // Empty array = detach all = applies to all branches
        $discount->branches()->sync($validated['branch_ids'] ?? []);
        $discount->load('branches:id,name');

        AuditLog::create([
            'user_id'    => Auth::id(),
            'action'     => "Updated discount: {$discount->name}",
            'module'     => 'Discounts',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($discount);
    }

    // ── Toggle status ──────────────────────────────────────────────────────────

    public function toggleStatus(Discount $discount)
    {
        try {
            $oldStatus        = $discount->status;
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

    // ── Update branches only ───────────────────────────────────────────────────

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

    // ── Delete ─────────────────────────────────────────────────────────────────

    public function destroy(Discount $discount)
    {
        try {
            $discountName = $discount->name;
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

    // ── Record usage ───────────────────────────────────────────────────────────

    public function recordUsage(Discount $discount)
    {
        if (!$discount->isValid()) {
            return response()->json(['error' => 'Discount is not active or outside its validity window.'], 422);
        }

        $discount->recordUsage();
        $discount->load('branches:id,name');

        return response()->json($discount);
    }
}