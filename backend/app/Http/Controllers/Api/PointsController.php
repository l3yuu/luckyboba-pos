<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PointsController extends Controller
{
    // GET /api/points
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $points = DB::table('user_points')
            ->where('user_id', $userId)
            ->value('points') ?? 0;

        $history = DB::table('point_transactions')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'points'  => $points,
            'history' => $history,
        ]);
    }

    // POST /api/points/redeem
    public function redeem(Request $request)
    {
        $request->validate([
            'points_to_redeem' => 'required|integer|min:100',
        ]);

        $userId         = $request->user()->id;
        $pointsToRedeem = $request->points_to_redeem;

        if ($pointsToRedeem % 100 !== 0) {
            return response()->json([
                'message' => 'Points must be redeemed in multiples of 100.',
            ], 422);
        }

        $currentPoints = DB::table('user_points')
            ->where('user_id', $userId)
            ->value('points') ?? 0;

        if ($currentPoints < $pointsToRedeem) {
            return response()->json([
                'message'        => 'Insufficient points.',
                'current_points' => $currentPoints,
            ], 422);
        }

        $discount = ($pointsToRedeem / 100) * 10;

        DB::table('user_points')
            ->where('user_id', $userId)
            ->decrement('points', $pointsToRedeem);

        DB::table('point_transactions')->insert([
            'user_id'    => $userId,
            'type'       => 'redeem',
            'points'     => $pointsToRedeem,
            'source'     => 'checkout',
            'note'       => "Redeemed {$pointsToRedeem} pts for ₱{$discount} discount",
            'created_at' => now(),
        ]);

        return response()->json([
            'success'          => true,
            'points_used'      => $pointsToRedeem,
            'discount'         => $discount,
            'points_remaining' => $currentPoints - $pointsToRedeem,
        ]);
    }
}