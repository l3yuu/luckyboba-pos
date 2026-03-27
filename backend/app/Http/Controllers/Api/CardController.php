<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CardController extends Controller
{
    // ── PUBLIC: Flutter app fetches this ─────────────────────────────────────
    // GET /api/cards
    public function index()
    {
        $cards = Card::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($card) => [
                'id'               => $card->id,
                'title'            => $card->title,
                'image_url'        => $card->image_url,
                'price'            => number_format($card->price, 0),
                'price_raw'        => (float) $card->price,
                'is_active'        => (bool) $card->is_active,
                'available_months' => $card->available_months,
            ]);

        return response()->json(['success' => true, 'data' => $cards]);
    }

    // ── ADMIN: Get all cards including inactive ───────────────────────────────
    // GET /api/admin/cards
    public function adminIndex()
    {
        $cards = Card::orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $cards]);
    }

    // ── ADMIN: Get pending card approvals ─────────────────────────────────────
    // GET /api/admin/cards/pending
    public function getPendingApprovals()
    {
        $pending = DB::table('user_cards')
            ->join('users', 'user_cards.user_id', '=', 'users.id')
            ->join('cards', 'user_cards.card_id', '=', 'cards.id')
            ->where('user_cards.status', 'pending')
            ->select(
                'user_cards.id',
                'users.name as user_name',
                'users.email as user_email',
                'cards.title as card_title',
                'user_cards.payment_method',
                'user_cards.transaction_id as reference_number',
                'user_cards.created_at'
            )
            ->orderBy('user_cards.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $pending]);
    }

    // ── ADMIN: Approve a card registration ────────────────────────────────────
    // POST /api/admin/cards/{id}/approve
    public function approveCard($id)
    {
        $updated = DB::table('user_cards')->where('id', $id)->update([
            'status'     => 'active',
            'expires_at' => Carbon::now()->addDays(30),
            'updated_at' => now(),
        ]);

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Card not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Card approved and activated for 30 days.']);
    }

    // ── ADMIN: Reject a card registration ─────────────────────────────────────
    // POST /api/admin/cards/{id}/reject
    public function rejectCard($id)
    {
        $updated = DB::table('user_cards')->where('id', $id)->update([
            'status'     => 'rejected',
            'updated_at' => now(),
        ]);

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Card not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Card registration rejected.']);
    }

    // ── ADMIN: Get all active card members ────────────────────────────────────
    // GET /api/admin/cards/users
    public function getCardUsers()
    {
        $members = DB::table('user_cards')
            ->join('users', 'user_cards.user_id', '=', 'users.id')
            ->join('cards', 'user_cards.card_id', '=', 'cards.id')
            ->where('user_cards.status', 'active')
            ->whereRaw('user_cards.expires_at > NOW()')
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
            ->orderBy('user_cards.created_at', 'desc')
            ->get()
            ->map(function ($member) {
                // Fetch today's claimed promos for this user+card
                $claimedToday = DB::table('card_usage_logs')
                    ->where('user_id', $member->user_id)
                    ->where('card_id', $member->card_id)
                    ->whereDate('created_at', today())
                    ->pluck('promo_type')
                    ->toArray();

                $member->claimed_promos = $claimedToday;
                $member->expiry_date    = Carbon::parse($member->expiry_date)->toDateString();
                $member->purchase_date  = Carbon::parse($member->purchase_date)->toDateString();
                return $member;
            });

        return response()->json(['success' => true, 'data' => $members]);
    }

    // ── ADMIN: Log a daily perk usage ─────────────────────────────────────────
    // POST /api/admin/cards/users/{userId}/log-usage
    public function logUsage(Request $request, $userId)
    {
        $request->validate([
            'card_id'    => 'required|integer',
            'promo_type' => 'required|string',
        ]);

        $alreadyClaimed = DB::table('card_usage_logs')
            ->where('user_id', $userId)
            ->where('card_id', $request->card_id)
            ->where('promo_type', $request->promo_type)
            ->whereDate('created_at', today())
            ->exists();

        if ($alreadyClaimed) {
            return response()->json([
                'success' => false,
                'message' => 'This perk has already been claimed today.',
            ], 409);
        }

        DB::table('card_usage_logs')->insert([
            'user_id'    => $userId,
            'card_id'    => $request->card_id,
            'promo_type' => $request->promo_type,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Perk logged successfully.']);
    }

    // ── ADMIN: Create new card ────────────────────────────────────────────────
    // POST /api/admin/cards
    public function store(Request $request)
    {
        $request->validate([
            'title'            => 'required|string|max:100',
            'price'            => 'required|numeric|min:0',
            'image'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'is_active'        => 'boolean',
            'sort_order'       => 'integer',
            'available_months' => 'nullable|string',
        ]);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path     = $request->file('image')->store('cards', 'public');
            $imageUrl = config('app.url') . Storage::url($path);
        }

        $card = Card::create([
            'title'            => $request->title,
            'price'            => $request->price,
            'image'            => $imageUrl ?? 'cards/default.png',
            'is_active'        => $request->boolean('is_active', true),
            'sort_order'       => $request->integer('sort_order', 0),
            'available_months' => $request->available_months,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Card created successfully.',
            'data'    => $card,
        ], 201);
    }

    // ── ADMIN: Update card ────────────────────────────────────────────────────
    // POST /api/admin/cards/{id}  (use POST with _method=PUT for multipart)
    public function update(Request $request, $id)
    {
        $card = Card::findOrFail($id);

        $request->validate([
            'title'            => 'sometimes|string|max:100',
            'price'            => 'sometimes|numeric|min:0',
            'image'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'is_active'        => 'boolean',
            'sort_order'       => 'integer',
            'available_months' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $path        = $request->file('image')->store('cards', 'public');
            $card->image = config('app.url') . Storage::url($path);
        }

        $card->fill($request->only([
            'title', 'price', 'is_active', 'sort_order', 'available_months',
        ]));
        $card->save();

        return response()->json([
            'success' => true,
            'message' => 'Card updated successfully.',
            'data'    => $card,
        ]);
    }

    // ── ADMIN: Toggle active/inactive ────────────────────────────────────────
    // PATCH /api/admin/cards/{id}/toggle
    public function toggle($id)
    {
        $card            = Card::findOrFail($id);
        $card->is_active = ! $card->is_active;
        $card->save();

        return response()->json([
            'success'   => true,
            'message'   => 'Card ' . ($card->is_active ? 'activated' : 'deactivated') . '.',
            'is_active' => $card->is_active,
        ]);
    }

    // ── ADMIN: Delete card ────────────────────────────────────────────────────
    // DELETE /api/admin/cards/{id}
    public function destroy($id)
    {
        Card::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Card deleted.']);
    }
}