<?php
// app/Http/Controllers/Api/AuditLogController.php

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
        ]);

        $query = AuditLog::with('user:id,name')
            ->orderByDesc('created_at');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('action',  'like', "%{$s}%")
                  ->orWhere('module', 'like', "%{$s}%")
                  ->orWhere('details','like', "%{$s}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$s}%"));
            });
        }

        if ($request->module && $request->module !== 'all') {
            $query->where('module', $request->module);
        }

        $perPage = $request->per_page ?? 20;
        $logs    = $query->paginate($perPage);

        // Stats
        $todayStart = now()->startOfDay();
        $stats = [
            'total_events'  => AuditLog::count(),
            'today_count'   => AuditLog::where('created_at', '>=', $todayStart)->count(),
            'voids_today'   => AuditLog::where('created_at', '>=', $todayStart)->where('module', 'void')->count(),
            'unique_users'  => AuditLog::where('created_at', '>=', $todayStart)->distinct('user_id')->count('user_id'),
            'modules'       => AuditLog::distinct('module')->pluck('module')->filter()->values(),
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

    public function stats()
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total_events' => AuditLog::count(),
                'today_count'  => AuditLog::where('created_at', '>=', now()->startOfDay())->count(),
                'voids_today'  => AuditLog::where('created_at', '>=', now()->startOfDay())->where('module', 'void')->count(),
                'unique_users' => AuditLog::where('created_at', '>=', now()->startOfDay())->distinct('user_id')->count('user_id'),
            ],
        ]);
    }
}