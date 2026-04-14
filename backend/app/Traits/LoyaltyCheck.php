<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

trait LoyaltyCheck
{
    /**
     * Check if the authenticated user has an active loyalty card.
     *
     * @param Request $request
     * @return bool
     */
    protected function hasActiveCard(Request $request): bool
    {
        $user = $request->user();
        if (!$user) return false;

        return DB::table('user_cards')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->whereRaw('expires_at > NOW()')
            ->exists();
    }

    /**
     * Unauthorized response for loyalty gated features.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    protected function loyaltyRequiredResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'Active loyalty card required to access this feature.'
        ], 403);
    }
}
