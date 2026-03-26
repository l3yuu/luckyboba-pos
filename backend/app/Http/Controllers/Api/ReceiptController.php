<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\VoidRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ReceiptController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    // GET NEXT SI SEQUENCE (per branch)
    // ─────────────────────────────────────────────────────────────
    public function getNextSequence(Request $request)
    {
        $branchId = $request->user()?->branch_id;

        $latest = Sale::where('invoice_number', 'LIKE', 'SI-%')
            ->whereRaw("invoice_number REGEXP '^SI-[0-9]+$'")
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->orderByRaw('CAST(SUBSTRING(invoice_number, 4) AS UNSIGNED) DESC')
            ->first();

        $nextSeq = $latest
            ? ((int) substr($latest->invoice_number, 3)) + 1
            : 1;

        return response()->json([
            'next_sequence' => $nextSeq
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // SEARCH RECEIPTS
    // ─────────────────────────────────────────────────────────────
    public function search(Request $request)
    {
        $user  = $request->user();
        $query = strtolower($request->input('query', ''));
        $date  = $request->input('date');

        $dbQuery = Receipt::query()
            ->leftJoin('sales', 'receipts.sale_id', '=', 'sales.id')
            // ✅ Join branches to pull BIR fields
            ->leftJoin('branches', 'sales.branch_id', '=', 'branches.id')
            ->select([
                'receipts.sale_id',
                'receipts.si_number',
                'receipts.cashier_name',
                'receipts.terminal',
                'receipts.items_count',
                'receipts.created_at',

                'sales.total_amount',
                'sales.payment_method',
                'sales.cash_tendered',
                'sales.reference_number',
                'sales.charge_type',
                'sales.status',
                'sales.cancellation_reason',
                'sales.customer_name',

                // ✅ BIR fields from branch
                'branches.brand',
                'branches.company_name',
                'branches.store_address',
                'branches.vat_reg_tin',
                'branches.min_number',
                'branches.serial_number',
                'branches.vat_type',
                'branches.ownership_type',
            ])
            ->selectRaw("
                EXISTS(
                    SELECT 1 FROM sale_items si
                    JOIN menu_items mi ON si.menu_item_id = mi.id
                    JOIN categories c ON mi.category_id = c.id
                    WHERE si.sale_id = sales.id
                    AND c.type = 'drink'
                ) as has_stickers
            ");

        // Branch restriction
        if ($user->role !== 'superadmin' && $user->branch_id) {
            $dbQuery->where('receipts.branch_id', $user->branch_id);
        }

        // Date filter
        if ($date) {
            $dbQuery->whereDate('receipts.created_at', $date);
        }

        // Search filter
        if ($query) {
            $dbQuery->where(function ($q) use ($query) {
                $q->whereRaw('LOWER(receipts.si_number) LIKE ?', ["%{$query}%"])
                  ->orWhereRaw('LOWER(receipts.cashier_name) LIKE ?', ["%{$query}%"])
                  ->orWhereRaw('LOWER(receipts.terminal) LIKE ?', ["%{$query}%"]);
            });
        }

        $results = $dbQuery
            ->latest('receipts.created_at')
            ->limit(50)
            ->get()
            // ✅ Append VAT computation per row
            ->map(fn($row) => $this->appendVatFields($row));

        $completed = $results->where('status', '!=', 'cancelled');
        $voided    = $results->where('status', 'cancelled');

        return response()->json([
            'results' => $results->values(),
            'stats'   => [
                'gross'  => round($completed->sum('total_amount'), 2),
                'voided' => round($voided->sum('total_amount'), 2),
                'net'    => round(
                    $completed->sum('total_amount') - $voided->sum('total_amount'),
                    2
                ),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 1: CREATE VOID REQUEST
    // ─────────────────────────────────────────────────────────────
    public function voidRequest(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);

        if (strtolower($sale->status) === 'cancelled') {
            return response()->json(['message' => 'Already voided.'], 422);
        }

        $user = $request->user();

        $voidRequest = VoidRequest::create([
            'sale_id'    => $sale->id,
            'cashier_id' => $user->id,
            'branch_id'  => $user->branch_id,
            'reason'     => $request->input('reason', 'Voided by manager'),
            'status'     => 'pending',
        ]);

        return response()->json([
            'message'         => 'Void request created.',
            'void_request_id' => $voidRequest->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: APPROVE VOID
    // ─────────────────────────────────────────────────────────────
    public function approveVoid(Request $request, $id)
    {
        $request->validate([
            'manager_pin' => 'required',
        ]);

        $voidRequest = VoidRequest::with('sale')->findOrFail($id);

        $sale = $voidRequest->sale;

        if (!$sale) {
            return response()->json(['message' => 'Sale not found.'], 422);
        }

        if (strtolower($sale->status) === 'cancelled') {
            return response()->json(['message' => 'Already voided.'], 422);
        }

        $manager = User::where('role', 'branch_manager')
            ->where('branch_id', $sale->branch_id)
            ->first();

        if (!$manager || !$manager->manager_pin) {
            return response()->json([
                'message' => 'Branch manager PIN not configured.'
            ], 422);
        }

        if (!Hash::check($request->manager_pin, $manager->manager_pin)) {
            return response()->json([
                'message' => 'Incorrect PIN. Please try again.'
            ], 422);
        }

        $voidRequest->update(['status' => 'approved']);
        $sale->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Void approved successfully.'
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // REPRINT DATA
    // ─────────────────────────────────────────────────────────────
    public function reprint(Request $request, int $id)
    {
        $type = $request->query('type', 'receipt');

        $sale = Sale::with(['items.menuItem.category', 'branch'])
            ->findOrFail($id);

        $receipt = Receipt::where('sale_id', $id)->first();

        $saleArray = $sale->toArray();

        // Normalize items → sale_items
        if (!isset($saleArray['sale_items']) && isset($saleArray['items'])) {
            $saleArray['sale_items'] = $saleArray['items'];
        }

        // Queue number (from SI)
        $saleArray['queue_number'] = ltrim(
            str_replace('SI-', '', $sale->invoice_number),
            '0'
        ) ?: '0';

        // ✅ BIR fields from the related branch
        $branch = $sale->branch;
        $birFields = [
            'brand'          => $branch?->brand          ?? 'Lucky Boba Milk Tea',
            'company_name'   => $branch?->company_name   ?? '',
            'store_address'  => $branch?->store_address  ?? '',
            'vat_reg_tin'    => $branch?->vat_reg_tin    ?? '',
            'min_number'     => $branch?->min_number     ?? '',
            'serial_number'  => $branch?->serial_number  ?? '',
            'vat_type'       => $branch?->vat_type       ?? 'vat',
            'ownership_type' => $branch?->ownership_type ?? 'company',
        ];

        // ✅ VAT computation
        $total      = (float) $sale->total_amount;
        $isVat      = ($branch?->vat_type ?? 'vat') === 'vat';
        $vatFields  = $isVat
            ? [
                'vat_amount'    => round($total - ($total / 1.12), 2),   // VAT inclusive breakdown
                'vat_exclusive' => round($total / 1.12, 2),              // amount before VAT
                'vat_rate'      => 12,
            ]
            : [
                'vat_amount'    => 0,
                'vat_exclusive' => $total,
                'vat_rate'      => 0,
            ];

        return response()->json([
            'type'    => $type,
            'sale'    => $saleArray,
            'receipt' => $receipt,
            'payment' => [
                'method'        => $sale->payment_method,
                'cash_tendered' => (float) ($sale->cash_tendered ?? 0),
                'reference'     => $sale->reference_number,
                'charge_type'   => $sale->charge_type,
            ],
            // ✅ New keys
            'bir'     => $birFields,
            'vat'     => $vatFields,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER — compute and append VAT fields to a result row
    // ─────────────────────────────────────────────────────────────
    private function appendVatFields(object $row): object
    {
        $total = (float) ($row->total_amount ?? 0);
        $isVat = ($row->vat_type ?? 'vat') === 'vat';

        $row->vat_amount    = $isVat ? round($total - ($total / 1.12), 2) : 0;
        $row->vat_exclusive = $isVat ? round($total / 1.12, 2)            : $total;
        $row->vat_rate      = $isVat ? 12                                  : 0;

        return $row;
    }
}