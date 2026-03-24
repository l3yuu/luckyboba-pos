<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CardPurchaseController extends Controller
{
    public function purchase(Request $request)
    {
        // 1. Check if the user ALREADY has an active, unexpired card
        $existingCard = DB::table('user_cards')
            ->where('user_id', $request->user_id)
            ->where('status', 'active')
            ->whereRaw('expires_at > NOW()')
            ->first();

        if ($existingCard) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active card!'
            ], 400);
        }

        // 2. Check if they already have a pending request so they don't spam
        $existingPending = DB::table('user_cards')
            ->where('user_id', $request->user_id)
            ->where('status', 'pending')
            ->first();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending card request. Please wait for admin approval.',
            ], 400);
        }

        // 3. Insert new card as PENDING — waiting for Admin to approve
        DB::table('user_cards')->insert([
            'user_id'        => $request->user_id,
            'card_id'        => $request->card_id,
            'status'         => 'pending',                  // ⬅ Changed to pending
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->reference_number, // ⬅ Saves the real GCash/Maya ref number from Flutter
            'expires_at'     => null,                       // ⬅ Expiration starts only AFTER admin approves
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted for admin review.'
        ], 201);
    }

    public function checkStatus($userId)
    {
        // ✅ Uses database's own clock (NOW()) to avoid PHP timezone issues
        $activeCard = DB::table('user_cards')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereRaw('expires_at > NOW()')
            ->orderBy('expires_at', 'desc')
            ->first();

        if ($activeCard) {
            $expiresAt     = Carbon::parse($activeCard->expires_at);
            $now           = Carbon::now();
            $daysRemaining = (int) $now->diffInDays($expiresAt, false);

            return response()->json([
                'has_active_card'      => true,
                'card_id'              => $activeCard->card_id,
                'expires_at'           => $expiresAt->toDateString(),
                'expires_at_formatted' => $expiresAt->format('M d, Y'),
                'days_remaining'       => max(0, $daysRemaining),
            ]);
        }

        return response()->json([
            'has_active_card' => false,
        ]);
    }
}