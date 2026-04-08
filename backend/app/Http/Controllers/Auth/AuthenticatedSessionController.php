<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
public function store(Request $request): JsonResponse
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = \App\Models\User::where('email', $request->email)->first();

    if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'The provided credentials are incorrect.'
        ], 401);
    }

    $token = $user->createToken('lucky_boba_token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
    ]);

    $requestedBranchName = trim($request->input('branch_name')); 

    $branch = \App\Models\Branch::whereRaw('LOWER(name) = ?', [strtolower($requestedBranchName)])->first();

    \Log::info('Branch lookup', [
        'requested' => $request->input('branch_name'),
        'cleaned'   => $requestedBranchName, // Let's log the cleaned version too
        'found'     => $branch?->name,
        'found_id'  => $branch?->id,
    ]);
}

    /**
     * Destroy an authenticated session.
     */
public function destroy(Request $request)
{
    $user = $request->user();
    
    // Defensive check to see if the token exists before deleting
    if ($user && $user->currentAccessToken()) {
        $user->currentAccessToken()->delete();
    }

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}