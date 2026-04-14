<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Traits\LoyaltyCheck;

class FavoriteController extends Controller
{
    use LoyaltyCheck;

    public function index(Request $request)
    {
        if (!$this->hasActiveCard($request)) {
            return $this->loyaltyRequiredResponse();
        }

        $favorites = Favorite::with('menuItem')
            ->where('user_id', $request->user()->id)
            ->get();
        
        return response()->json($favorites);
    }

    public function store(Request $request)
    {
        if (!$this->hasActiveCard($request)) {
            return $this->loyaltyRequiredResponse();
        }

        $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id'
        ]);

        $favorite = Favorite::updateOrCreate([
            'user_id' => $request->user()->id,
            'menu_item_id' => $request->menu_item_id
        ]);

        return response()->json([
            'message' => 'Added to favorites',
            'favorite' => $favorite
        ], 201);
    }

    public function destroy(Request $request, $menuItemId)
    {
        Favorite::where('user_id', $request->user()->id)
            ->where('menu_item_id', $menuItemId)
            ->delete();

        return response()->json(['message' => 'Removed from favorites']);
    }
}
