<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LoyaltyManagementController extends Controller
{
    /**
     * Get global loyalty settings.
     */
    public function getSettings(): JsonResponse
    {
        $settings = [
            'points_per_currency'   => Setting::where('key', 'points_per_currency')->value('value') ?? '1',
            'card_point_multiplier' => Setting::where('key', 'card_point_multiplier')->value('value') ?? '2',
        ];

        return response()->json($settings);
    }

    /**
     * Update global loyalty settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'points_per_currency'   => 'required|numeric|min:0',
            'card_point_multiplier' => 'required|numeric|min:1',
        ]);

        Setting::updateOrCreate(['key' => 'points_per_currency'], ['value' => $request->points_per_currency]);
        Setting::updateOrCreate(['key' => 'card_point_multiplier'], ['value' => $request->card_point_multiplier]);

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    /**
     * Manage Rewards (CRUD).
     */
    public function getRewards(): JsonResponse
    {
        return response()->json(Reward::orderBy('point_cost')->get());
    }

    public function storeReward(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'point_cost' => 'required|integer|min:1',
            'category'   => 'required|string',
            'is_active'  => 'boolean',
        ]);

        $reward = Reward::create($request->all());

        return response()->json($reward, 201);
    }

    public function updateReward(Request $request, int $id): JsonResponse
    {
        $reward = Reward::findOrFail($id);
        
        $request->validate([
            'name'       => 'string|max:255',
            'point_cost' => 'integer|min:1',
            'category'   => 'string',
            'is_active'  => 'boolean',
        ]);

        $reward->update($request->all());

        return response()->json($reward);
    }

    public function deleteReward(int $id): JsonResponse
    {
        $reward = Reward::findOrFail($id);
        $reward->delete();

        return response()->json(['message' => 'Reward deleted.']);
    }

    /**
     * User Points Overview.
     */
    public function getUserPoints(Request $request): JsonResponse
    {
        $query = DB::table('users')
            ->join('user_points', 'users.id', '=', 'user_points.user_id')
            ->select('users.id', 'users.name', 'users.email', 'user_points.points', 'user_points.updated_at')
            ->orderByDesc('user_points.points');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('users.name', 'like', "%$search%")
                  ->orWhere('users.email', 'like', "%$search%");
            });
        }

        return response()->json($query->paginate(20));
    }
}
