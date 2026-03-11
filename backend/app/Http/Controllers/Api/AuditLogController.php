<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

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

        // ── Stats ────────────────────────────────────────────────────────────
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

        // Add this inside the index() method, before the return
        $lastLogins = AuditLog::select('user_id', \DB::raw('MAX(created_at) as last_login_at'))
            ->where('action', 'like', '%login%')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->pluck('last_login_at', 'user_id');

        return response()->json([
            'success' => true,
            'stats'   => $stats,
            'data'    => $logs->items(),
            'last_logins' => $lastLogins, 
            'meta'    => [
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
                                          ->orWhere('action', 'like', '%void%');
                                    })->count(),
                'unique_users' => AuditLog::where('created_at', '>=', $todayStart)
                                    ->whereNotNull('user_id')
                                    ->distinct('user_id')
                                    ->count('user_id'),
            ],
        ]);
    }
}