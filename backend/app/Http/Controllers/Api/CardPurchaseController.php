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
            ->where('expires_at', '>', Carbon::now()) // Make sure it hasn't expired
            ->first();

        // If they have one, reject the purchase!
        if ($existingCard) {
            return response()->json([
                'status' => 'error',
                'message' => 'You already have an active card!'
            ], 400); // 400 means Bad Request
        }

        // 2. If they don't have one, insert the new card (Expires in 30 days!)
        DB::table('user_cards')->insert([
            'user_id' => $request->user_id, 
            'card_id' => $request->card_id,
            'status' => 'active',
            'payment_method' => $request->payment_method,
            'transaction_id' => 'ADMIN-TEST-' . rand(1000, 9999),
            'expires_at' => Carbon::now()->addDays(30), // Sets expiration to exactly 30 days from now
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Card successfully activated for 30 days!'
        ]);
    }

    // --- NEW FUNCTION: The app will call this when it opens ---
    public function checkStatus($userId)
    {
        $activeCard = DB::table('user_cards')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if ($activeCard) {
            return response()->json([
                'has_active_card' => true,
                'card_id' => $activeCard->card_id, // ✅ ADDED THIS LINE: Tell Flutter which card to show!
                'expires_at' => $activeCard->expires_at
            ]);
        }

        return response()->json([
            'has_active_card' => false
        ]);
    }
}