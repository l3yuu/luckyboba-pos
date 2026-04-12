<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Sale;
use App\Services\DashboardService;
use App\Http\Requests\StoreSaleRequest;
use App\Actions\Sales\ProcessCheckoutAction;
use App\Http\Resources\SaleResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesController extends Controller
{
    protected DashboardService $dashboardService;
    protected ProcessCheckoutAction $processCheckoutAction;

    public function __construct(
        DashboardService $dashboardService,
        ProcessCheckoutAction $processCheckoutAction
    ) {
        $this->dashboardService = $dashboardService;
        $this->processCheckoutAction = $processCheckoutAction;
    }

    /**
     * Store a newly created Sale transaction.
     */
    public function store(StoreSaleRequest $request)
    {
        $validated   = $request->validated();
        $user        = auth('sanctum')->user() ?? $request->user();
        $userId      = $user?->getAttribute('id');
        $branchId    = $user?->getAttribute('branch_id');
        $cashierName = $request->input('cashier_name') ?? ($user?->getAttribute('name') ?? 'System Admin');

        $result = $this->processCheckoutAction->execute($validated, $userId, $branchId, $cashierName);

        // Map status to correct HTTP code
        $statusCode = $result['is_new'] ? 201 : 200;

        return response()->json([
            'status'    => 'success',
            'si_number' => $validated['si_number'],
            'sale'      => new SaleResource($result['sale']),
        ], $statusCode);
    }

    /**
     * Display listing of Sales.
     */
    public function index()
    {
        $user = auth('sanctum')->user();
        $query = Sale::with('items', 'user')->latest();

        if ($user && !in_array($user->getAttribute('role'), ['superadmin', 'admin'])) {
            $query->where('branch_id', $user->getAttribute('branch_id'));
        }

        // Apply Resource Collection wrapper
        return SaleResource::collection($query->paginate(20));
    }

    /**
     * Void a specific sale.
     */
    public function cancel(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            /** @var \App\Models\Sale $sale */
            $sale = Sale::with('items')->findOrFail($id);
            /** @var \App\Models\User $user */
            $user = $request->user();
            
            if ($user->getAttribute('role') === 'supervisor' && $sale->getAttribute('branch_id') !== $user->getAttribute('branch_id')) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($sale->getAttribute('status') === 'cancelled') {
                return response()->json(['message' => 'Sale already cancelled'], 400);
            }

            // Restore items quantity to inventory
            foreach ($sale->getRelation('items') as $item) {
                $menuItem = MenuItem::find($item->getAttribute('menu_item_id'));
                if ($menuItem) {
                    $menuItem->increment('quantity', $item->getAttribute('quantity'));
                } else {
                    Log::warning("Inventory restore failed for sale #{$sale->getAttribute('invoice_number')}: MenuItem ID {$item->getAttribute('menu_item_id')} not found.");
                }
            }

            $sale->update([
                'status'              => 'cancelled',
                'cancellation_reason' => $request->input('reason'),
                'cancelled_at'        => now(),
            ]);

            DB::commit();
            
            $this->dashboardService->clearTodayCache($sale->getAttribute('branch_id'));
            AuditHelper::log('void', "Voided transaction #{$sale->getAttribute('id')}", "Amount: {$sale->getAttribute('total_amount')}");

            return response()->json(['status' => 'success', 'message' => 'Voided successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale cancellation failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}