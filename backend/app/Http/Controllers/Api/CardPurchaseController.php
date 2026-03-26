<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CardPurchaseController extends Controller
{
    // ── MOBILE APP: SUBMIT PURCHASE ──────────────────────────────────────────
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
            'status'         => 'pending',
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->reference_number,
            'expires_at'     => null, // Expiration starts only AFTER admin approves
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted for admin review.'
        ], 201);
    }

    // ── MOBILE APP: CHECK CARD STATUS ─────────────────────────────────────────
    public function checkStatus($userId)
    {
        $card = DB::table('user_cards')
            ->join('cards', 'user_cards.card_id', '=', 'cards.id')
            ->select(
                'user_cards.card_id',
                'user_cards.expires_at',
                'user_cards.status',
                'cards.title as card_title'
            )
            ->where('user_cards.user_id', $userId)
            ->where('user_cards.status', 'active')
            ->whereRaw('user_cards.expires_at > NOW()')
            ->first();

        if (!$card) {
            return response()->json([
                'has_active_card' => false,
            ]);
        }

        $expiresAt     = Carbon::parse($card->expires_at);
        $daysRemaining = (int) now()->diffInDays($expiresAt, false);

        return response()->json([
            'has_active_card'      => true,
            'card_id'              => $card->card_id,
            'card_title'           => $card->card_title,
            'expires_at_formatted' => $expiresAt->format('M d, Y'),
            'days_remaining'       => max(0, $daysRemaining),
        ]);
    }

    // ── MOBILE APP: AUTOMATICALLY LOG PROMO WHEN REVEALED ───────────────────
    public function usePromo(Request $request)
    {
        $request->validate(['perk_name' => 'required|string']);
        $user = $request->user();

        // 1. Find the user's active card
        $activeCard = DB::table('user_cards')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->whereRaw('expires_at > NOW()')
            ->first();

        if (!$activeCard) {
            return response()->json(['success' => false, 'message' => 'No active card found.'], 400);
        }

        // 2. Translate Flutter's perkName to the React Admin ID
        $promoType = 'general';
        if ($request->perk_name === 'Buy 1 Take 1') {
            $promoType = 'buy_1_take_1';
        } elseif ($request->perk_name === '10% Off') {
            $promoType = '10_percent_off';
        }

        $today = Carbon::now()->toDateString();

        // 3. Log it if not already logged today
        $exists = DB::table('card_usage_logs')
            ->where('user_id', $user->id)
            ->where('card_id', $activeCard->card_id)
            ->where('promo_type', $promoType)
            ->where('used_date', $today)
            ->exists();

        if (!$exists) {
            DB::table('card_usage_logs')->insert([
                'user_id'    => $user->id,
                'card_id'    => $activeCard->card_id,
                'promo_type' => $promoType,
                'used_date'  => $today,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    // ── ADMIN: APPROVALS TAB ─────────────────────────────────────────────────
    public function getPending()
    {
        $pending = DB::table('user_cards')
            ->join('users', 'user_cards.user_id', '=', 'users.id')
            ->join('cards', 'user_cards.card_id', '=', 'cards.id')
            ->select(
                'user_cards.id',
                'users.name as user_name',
                'users.email as user_email',
                'cards.title as card_title',
                'cards.price as price',
                'user_cards.payment_method',
                'user_cards.transaction_id',
                'user_cards.created_at'
            )
            ->where('user_cards.status', 'pending')
            ->orderBy('user_cards.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $pending]);
    }

    public function approve($id)
    {
        DB::table('user_cards')->where('id', $id)->update([
            'status'     => 'active',
            'expires_at' => Carbon::now()->addDays(30), // Valid for 30 days from approval
            'updated_at' => Carbon::now()
        ]);
        return response()->json(['success' => true]);
    }

    public function reject($id)
    {
        DB::table('user_cards')->where('id', $id)->update([
            'status'     => 'rejected',
            'updated_at' => Carbon::now()
        ]);
        return response()->json(['success' => true]);
    }

    // ── ADMIN: CARD MEMBERS TAB ──────────────────────────────────────────────
    public function getCardUsers()
    {
        $today = Carbon::now()->toDateString();

        // 1. Fetch all ACTIVE cards that are not expired yet
        $activeUsers = DB::table('user_cards')
            ->join('users', 'user_cards.user_id', '=', 'users.id')
            ->join('cards', 'user_cards.card_id', '=', 'cards.id')
            ->select(
                'user_cards.id',
                'user_cards.user_id',
                'user_cards.card_id',
                'users.name as user_name',
                'users.email as user_email',
                'cards.title as card_title',
                'user_cards.created_at as purchase_date',
                'user_cards.expires_at as expiry_date',
                'user_cards.status'
            )
            ->where('user_cards.status', 'active')
            ->whereRaw('user_cards.expires_at > NOW()')
            ->orderBy('user_cards.created_at', 'desc')
            ->get();

        // 2. Loop through them and check if they claimed a promo today
        $data = $activeUsers->map(function ($purchase) use ($today) {
            $usedToday = DB::table('card_usage_logs')
                ->where('user_id', $purchase->user_id)
                ->where('used_date', $today)
                ->exists();

            return [
                'id'               => $purchase->id,
                'user_id'          => $purchase->user_id,
                'card_id'          => $purchase->card_id,
                'user_name'        => $purchase->user_name ?? 'Unknown User',
                'user_email'       => $purchase->user_email ?? 'No Email',
                'card_title'       => $purchase->card_title ?? 'Unknown Card',
                'purchase_date'    => Carbon::parse($purchase->purchase_date)->format('Y-m-d'),
                'expiry_date'      => Carbon::parse($purchase->expiry_date)->format('Y-m-d'),
                'used_promo_today' => $usedToday,
                'status'           => 'active'
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function logPromoUsage(Request $request, $userId)
    {
        $request->validate(['card_id' => 'required|integer']);
        $today = Carbon::now()->toDateString();

        // Prevent double claiming just in case
        $exists = DB::table('card_usage_logs')
            ->where('user_id', $userId)
            ->where('card_id', $request->card_id)
            ->where('used_date', $today)
            ->exists();

        if (!$exists) {
            DB::table('card_usage_logs')->insert([
                'user_id'    => $userId,
                'card_id'    => $request->card_id,
                'used_date'  => $today,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Promo claimed successfully!']);
    }
}