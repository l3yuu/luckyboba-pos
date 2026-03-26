<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // ── Invalid credentials ───────────────────────────────────────────────
        if (! $user || ! Hash::check($request->password, $user->password)) {
            AuditLog::create([
                'user_id'    => null,
                'action'     => "Failed login attempt for: {$request->email}",
                'module'     => 'Auth',
                'details'    => 'Invalid credentials',
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        // ── FIX 1: Block INACTIVE accounts before issuing a token ────────────
        // Previously a token was issued first, then CheckUserActive blocked the
        // very next request (/api/user), making the frontend think the session
        // had expired rather than showing a proper "account deactivated" error.
        if ($user->status === 'INACTIVE') {
            AuditLog::create([
                'user_id'    => $user->id,
                'action'     => "Blocked login for inactive account: {$user->name}",
                'module'     => 'Auth',
                'details'    => 'Account is INACTIVE',
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        $user->load('branch');
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => "User logged in: {$user->name}",
            'module'     => 'Auth',
            'details'    => "Role: " . ($user->role ?? 'N/A'),
            'ip_address' => $request->ip(),
        ]);

        // ── FIX 2: Wrap in success envelope so frontend can check success flag
        return response()->json([
            'success' => true,
            'user'    => array_merge($user->toArray(), [
                'branch_vat_type' => $user->branch?->vat_type ?? 'vat',
            ]),
            'token'   => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => "User logged out: {$user->name}",
            'module'     => 'Auth',
            'details'    => null,
            'ip_address' => $request->ip(),
        ]);

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    // ── GOOGLE SIGN-IN ────────────────────────────────────────────────────────
    // Called by Flutter after Google Sign-In succeeds.
    // Creates the user if they don't exist, then returns the user object.
    public function googleLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name'  => 'required|string|max:255',
        ]);

        // Find existing user or create a new customer account
        $user = User::firstOrCreate(
            ['email' => $request->email],
            [
                'name'     => $request->name,
                'password' => Hash::make(Str::random(32)),
                'role'     => 'customer',
            ]
        );

        // Log the Google login
        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => "User signed in via Google: {$user->name}",
            'module'     => 'Auth',
            'details'    => "Email: {$user->email}",
            'ip_address' => $request->ip(),
        ]);

        // 🚨 ADDED: Generate the Sanctum token for the Google user
        $token = $user->createToken('auth_token')->plainTextToken;

        // 🚨 ADDED: Return the token alongside the user data
        return response()->json([
            'success' => true,
            'user'    => $user,
            'token'   => $token 
        ], 200);
    }
}