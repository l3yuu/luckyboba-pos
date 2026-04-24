<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use App\Models\User;
use App\Models\Sale;
use App\Models\MenuItem;
use App\Models\RawMaterial;
use App\Models\Expense;

class SearchController extends Controller
{
    /**
     * Perform a universal search across multiple models for the SuperAdmin dashboard.
     */
    public function index(Request $request)
    {
        $input = $request->query('q', '');
        $results = [];

        // ── 1. Detect Filters ────────────────────────────────────────────────
        $filter = null;
        $q = $input;

        if (str_contains($input, ':')) {
            $parts = explode(':', $input, 2);
            $filter = strtolower(trim($parts[0]));
            $q = trim($parts[1]);
        }

        if (empty($q) && empty($filter)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        // ── 2. Quick Actions ─────────────────────────────────────────────────
        $lowInput = strtolower($input);
        if (str_contains($lowInput, 'new') || str_contains($lowInput, 'add') || str_contains($lowInput, 'create')) {
            $actions = [
                ['title' => 'Add New Branch',   'sub' => 'Create a new store location', 'type' => 'action', 'tab' => 'branches'],
                ['title' => 'Add New User',     'sub' => 'Invite staff or admin',       'type' => 'action', 'tab' => 'users'],
                ['title' => 'New Raw Material', 'sub' => 'Add item to inventory',       'type' => 'action', 'tab' => 'raw_materials'],
                ['title' => 'Log Expense',      'sub' => 'Record a new cost',           'type' => 'action', 'tab' => 'expenses'],
            ];
            // Filter actions based on input if needed, or just show them
            $results = array_merge($results, $actions);
        }

        if (empty($q) && !empty($results)) {
             return response()->json(['success' => true, 'data' => $results]);
        }

        // ── 3. Model Search ──────────────────────────────────────────────────
        $results = array_merge(
            $results,
            $this->searchBranches($filter, $q),
            $this->searchUsers($filter, $q),
            $this->searchSales($filter, $q),
            $this->searchProducts($filter, $q),
            $this->searchRawMaterials($filter, $q),
            $this->searchExpenses($filter, $q)
        );

        return response()->json(['success' => true, 'data' => $results]);
    }

    private function searchBranches(?string $filter, string $q): array
    {
        if ($filter && !in_array($filter, ['branch', 'branches', 'loc'])) {
            return [];
        }
        return Branch::where('name', 'like', "%{$q}%")
            ->orWhere('location', 'like', "%{$q}%")
            ->limit(5)->get()->map(fn(Branch $b) => [
                'id' => $b->getAttribute('id'),
                'title' => $b->getAttribute('name'),
                'sub' => $b->getAttribute('location'),
                'type' => 'branch',
                'tab' => 'branches'
            ])->toArray();
    }

    private function searchUsers(?string $filter, string $q): array
    {
        if ($filter && !in_array($filter, ['user', 'users', 'staff'])) {
            return [];
        }
        return User::where('name', 'like', "%{$q}%")
            ->orWhere('email', 'like', "%{$q}%")
            ->limit(5)->get()->map(fn(User $u) => [
                'id' => $u->getAttribute('id'),
                'title' => $u->getAttribute('name'),
                'sub' => $u->getAttribute('role') . " | " . $u->getAttribute('email'),
                'type' => 'user',
                'tab' => 'users'
            ])->toArray();
    }

    private function searchSales(?string $filter, string $q): array
    {
        if ($filter && !in_array($filter, ['sale', 'sales', 'inv', 'receipt'])) {
            return [];
        }
        return Sale::where('invoice_number', 'like', "%{$q}%")
            ->orWhere('customer_name', 'like', "%{$q}%")
            ->latest()->limit(5)->get()->map(fn(Sale $s) => [
                'id' => $s->getAttribute('id'),
                'title' => $s->getAttribute('invoice_number'),
                'sub' => "₱" . number_format((float)$s->getAttribute('total_amount'), 2) . " | " . ($s->getAttribute('customer_name') ?? 'Walk-in'),
                'type' => 'sale',
                'tab' => 'sales_report'
            ])->toArray();
    }

    private function searchProducts(?string $filter, string $q): array
    {
        if ($filter && !in_array($filter, ['product', 'item', 'menu'])) {
            return [];
        }
        return MenuItem::where('name', 'like', "%{$q}%")
            ->limit(5)->get()->map(fn(MenuItem $p) => [
                'id' => $p->getAttribute('id'),
                'title' => $p->getAttribute('name'),
                'sub' => "₱" . number_format((float)$p->getAttribute('price'), 2),
                'type' => 'product',
                'tab' => 'menu_items'
            ])->toArray();
    }

    private function searchRawMaterials(?string $filter, string $q): array
    {
        if ($filter && !in_array($filter, ['mat', 'raw', 'stock', 'inventory'])) {
            return [];
        }
        return RawMaterial::where('name', 'like', "%{$q}%")
            ->limit(5)->get()->map(fn(RawMaterial $m) => [
                'id' => $m->getAttribute('id'),
                'title' => $m->getAttribute('name'),
                'sub' => "Stock: " . $m->getAttribute('current_stock') . " " . $m->getAttribute('unit'),
                'type' => 'inventory',
                'tab' => 'raw_materials'
            ])->toArray();
    }

    private function searchExpenses(?string $filter, string $q): array
    {
        if ($filter && !in_array($filter, ['exp', 'expense', 'cost'])) {
            return [];
        }
        return Expense::where('title', 'like', "%{$q}%")
            ->orWhere('ref_num', 'like', "%{$q}%")
            ->limit(5)->get()->map(fn(Expense $e) => [
                'id' => $e->getAttribute('id'),
                'title' => $e->getAttribute('title'),
                'sub' => "₱" . number_format((float)$e->getAttribute('amount'), 2) . " | " . $e->getAttribute('date'),
                'type' => 'expense',
                'tab' => 'expenses'
            ])->toArray();
    }
}
