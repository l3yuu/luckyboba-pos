<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'search'   => 'nullable|string|max:255',
            'module'   => 'nullable|string',
            'per_page' => 'nullable|integer|min:1|max:100',
            'date_from'=> 'nullable|date',
            'date_to'  => 'nullable|date',
        ]);

        $query = AuditLog::with('user:id,name')
            ->orderByDesc('created_at');

        // Search
        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('action',   'like', "%{$s}%")
                  ->orWhere('module',  'like', "%{$s}%")
                  ->orWhere('details', 'like', "%{$s}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$s}%"));
            });
        }

        // Module filter
        if ($request->module && $request->module !== 'all') {
            $query->where('module', $request->module);
        }

        // Date range filter
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->per_page ?? 20;
        $logs    = $query->paginate($perPage);

        // ── Stats ─────────────────────────────────────────────────────────────
        $todayStart = now()->startOfDay();

        $stats = [
            'total_events' => AuditLog::count(),
            'today_count'  => AuditLog::where('created_at', '>=', $todayStart)->count(),
            'voids_today'  => AuditLog::where('created_at', '>=', $todayStart)
                                ->where(function ($q) {
                                    $q->where('module', 'void')
                                      ->orWhere('action', 'like', '%void%')
                                      ->orWhere('action', 'like', '%Void%');
                                })->count(),
            'unique_users' => AuditLog::where('created_at', '>=', $todayStart)
                                ->whereNotNull('user_id')
                                ->distinct('user_id')
                                ->count('user_id'),
            // All distinct modules for the filter dropdown
            'modules'      => AuditLog::query()
                                ->distinct('module')
                                ->orderBy('module')
                                ->pluck('module')
                                ->filter()
                                ->values(),
        ];

        // ── Last logins per user ───────────────────────────────────────────────
        // Covers: "User logged in: ...", "logged in", "login" — all variations
        $lastLogins = AuditLog::select('user_id', DB::raw('MAX(created_at) as last_login_at'))
            ->where(function ($q) {
                $q->where('action', 'like', '%logged in%')
                  ->orWhere('action', 'like', '%User logged%')
                  ->orWhere('action', 'like', '%login%');
            })
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->pluck('last_login_at', 'user_id');

        return response()->json([
            'success'     => true,
            'stats'       => $stats,
            'data'        => $logs->items(),
            'last_logins' => $lastLogins,
            'meta'        => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }

    public function stats()
    {
        $todayStart = now()->startOfDay();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_events' => AuditLog::count(),
                'today_count'  => AuditLog::where('created_at', '>=', $todayStart)->count(),
                'voids_today'  => AuditLog::where('created_at', '>=', $todayStart)
                                    ->where(function ($q) {
                                        $q->where('module', 'void')
                                          ->orWhere('action', 'like', '%void%')
                                          ->orWhere('action', 'like', '%Void%');
                                    })->count(),
                'unique_users' => AuditLog::where('created_at', '>=', $todayStart)
                                    ->whereNotNull('user_id')
                                    ->distinct('user_id')
                                    ->count('user_id'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'action'  => 'required|string|max:500',
            'module'  => 'required|string|max:100',
            'details' => 'nullable|string|max:1000',
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action'  => $request->action,
            'module'  => $request->module,
            'details' => $request->details ?? null,
        ]);

        return response()->json(['success' => true]);
    }

    public function branchIndex(Request $request)
    {
        $request->validate([
            'search'   => 'nullable|string|max:255',
            'module'   => 'nullable|string',
            'per_page' => 'nullable|integer|min:1|max:100',
            'date_from'=> 'nullable|date',
            'date_to'  => 'nullable|date',
        ]);

        $branchId = $request->user()->branch_id;

        $branchUserIds = DB::table('users')
            ->where('branch_id', $branchId)
            ->whereIn('role', ['cashier', 'branch_manager'])
            ->pluck('id');

        $query = AuditLog::with('user:id,name')
            ->whereIn('user_id', $branchUserIds)
            ->orderByDesc('created_at');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('action',   'like', "%{$s}%")
                ->orWhere('module',  'like', "%{$s}%")
                ->orWhere('details', 'like', "%{$s}%")
                ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$s}%"));
            });
        }

        if ($request->module && $request->module !== 'all') {
            $query->where('module', $request->module);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->per_page ?? 20;
        $logs    = $query->paginate($perPage);
        $todayStart = now()->startOfDay();
        $base = AuditLog::whereIn('user_id', $branchUserIds);

        $stats = [
            'total_events' => (clone $base)->count(),
            'today_count'  => (clone $base)->where('created_at', '>=', $todayStart)->count(),
            'voids_today'  => (clone $base)->where('created_at', '>=', $todayStart)
                                ->where(fn($q) => $q->where('module', 'void')
                                    ->orWhere('action', 'like', '%void%')
                                    ->orWhere('action', 'like', '%Void%'))->count(),
            'unique_users' => (clone $base)->where('created_at', '>=', $todayStart)
                                ->whereNotNull('user_id')->distinct('user_id')->count('user_id'),
            'modules'      => (clone $base)->distinct('module')->orderBy('module')
                                ->pluck('module')->filter()->values(),
        ];

        return response()->json([
            'success' => true,
            'stats'   => $stats,
            'data'    => $logs->items(),
            'meta'    => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }
}