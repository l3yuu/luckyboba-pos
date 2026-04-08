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
        $existingCard = DB::table('user_cards')
            ->where('user_id', $request->user_id)
            ->where('status', 'active')
            ->whereRaw('expires_at > NOW()')
            ->first();

        if ($existingCard) {
            return response()->json([
                'status'  => 'error',
                'message' => 'You already have an active card!'
            ], 400);
        }

        DB::table('user_cards')->insert([
            'user_id'        => $request->user_id,
            'card_id'        => $request->card_id,
            'status'         => 'active',
            'payment_method' => $request->payment_method,
            'transaction_id' => 'ADMIN-TEST-' . rand(1000, 9999),
            'expires_at'     => Carbon::now()->addDays(30),
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Card successfully activated for 30 days!'
        ]);
    }

    public function checkStatus($userId)
    {
        $activeCard = DB::table('user_cards')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereRaw('expires_at > NOW()')
            ->join('cards', 'user_cards.card_id', '=', 'cards.id')
            ->select('user_cards.*', 'cards.title')
            ->orderBy('user_cards.expires_at', 'desc')
            ->first();

        if ($activeCard) {
            $expiresAt     = Carbon::parse($activeCard->expires_at);
            $now           = Carbon::now();
            $daysRemaining = (int) $now->diffInDays($expiresAt, false);

            $today     = now()->toDateString();

            // Returns display names: 'Buy 1, Get 1 Free' / '10% Off All Items'
            $usedToday = DB::table('card_usage_logs')
                ->where('user_id', $userId)
                ->whereDate('used_date', $today)
                ->pluck('promo_type')
                ->toArray();

            return response()->json([
                'has_active_card'      => true,
                'card_id'              => $activeCard->card_id,
                'expires_at'           => $expiresAt->toDateString(),
                'expires_at_formatted' => $expiresAt->format('F d, Y'),
                'days_remaining'       => max(0, $daysRemaining),
                'card' => [
                    'card_id'        => $activeCard->card_id,
                    'card_title'     => $activeCard->title,
                    'claimed_promos' => $usedToday,
                ],
            ]);
        }

        return response()->json(['has_active_card' => false]);
    }
}