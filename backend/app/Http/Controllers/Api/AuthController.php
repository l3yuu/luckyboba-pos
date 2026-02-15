<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if user exists and password is correct
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.'
            ], 401);
        }

        // Generate the Bearer Token
        $token = $user->createToken('lucky_boba_token')->plainTextToken;

        // Preload dashboard stats into cache
        $stats = $this->dashboardService->getHomeStats();

        return response()->json([
            'user' => $user,
            'token' => $token,
            'dashboard_stats' => $stats, // Include stats in login response
        ]);
    }

    public function logout(Request $request)
    {
        // Delete the token that was used for this request
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}