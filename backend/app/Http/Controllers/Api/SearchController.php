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
        
        // 1. Search Branches
        if (!$filter || in_array($filter, ['branch', 'branches', 'loc'])) {
            $branches = Branch::where('name', 'like', "%{$q}%")
                ->orWhere('location', 'like', "%{$q}%")
                ->limit(5)->get()->map(fn($b) => [
                    'id' => $b->id, 'title' => $b->name, 'sub' => $b->location, 'type' => 'branch', 'tab' => 'branches'
                ]);
            $results = array_merge($results, $branches->toArray());
        }

        // 2. Search Users
        if (!$filter || in_array($filter, ['user', 'users', 'staff'])) {
            $users = User::where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->limit(5)->get()->map(fn($u) => [
                    'id' => $u->id, 'title' => $u->name, 'sub' => $u->role . " | " . $u->email, 'type' => 'user', 'tab' => 'users'
                ]);
            $results = array_merge($results, $users->toArray());
        }

        // 3. Search Sales
        if (!$filter || in_array($filter, ['sale', 'sales', 'inv', 'receipt'])) {
            $sales = Sale::where('invoice_number', 'like', "%{$q}%")
                ->orWhere('customer_name', 'like', "%{$q}%")
                ->latest()->limit(5)->get()->map(fn($s) => [
                    'id' => $s->id, 'title' => $s->invoice_number, 
                    'sub' => "₱" . number_format((float)$s->total_amount, 2) . " | " . ($s->customer_name ?? 'Walk-in'), 
                    'type' => 'sale', 'tab' => 'sales_report'
                ]);
            $results = array_merge($results, $sales->toArray());
        }

        // 4. Search Products
        if (!$filter || in_array($filter, ['product', 'item', 'menu'])) {
            $products = MenuItem::where('name', 'like', "%{$q}%")
                ->limit(5)->get()->map(fn($p) => [
                    'id' => $p->id, 'title' => $p->name, 'sub' => "₱" . number_format((float)$p->price, 2), 'type' => 'product', 'tab' => 'menu_items'
                ]);
            $results = array_merge($results, $products->toArray());
        }

        // 5. Search Raw Materials
        if (!$filter || in_array($filter, ['mat', 'raw', 'stock', 'inventory'])) {
            $materials = RawMaterial::where('name', 'like', "%{$q}%")
                ->limit(5)->get()->map(fn($m) => [
                    'id' => $m->id, 'title' => $m->name, 'sub' => "Stock: " . $m->current_stock . " " . $m->unit, 'type' => 'inventory', 'tab' => 'raw_materials'
                ]);
            $results = array_merge($results, $materials->toArray());
        }

        // 6. Search Expenses
        if (!$filter || in_array($filter, ['exp', 'expense', 'cost'])) {
            $expenses = Expense::where('description', 'like', "%{$q}%")
                ->orWhere('ref_num', 'like', "%{$q}%")
                ->limit(5)->get()->map(fn($e) => [
                    'id' => $e->id, 'title' => $e->description, 
                    'sub' => "₱" . number_format((float)$e->amount, 2) . " | " . $e->date, 
                    'type' => 'expense', 'tab' => 'expenses'
                ]);
            $results = array_merge($results, $expenses->toArray());
        }

        return response()->json(['success' => true, 'data' => $results]);
    }
}
