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
            'email'       => 'required|email',
            'password'    => 'required',
            'device_name' => 'nullable|string',
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

        // ── Block INACTIVE accounts ───────────────────────────────────────────
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

        // ── Issue token ───────────────────────────────────────────────────────
        // NOTE: Device check for cashiers is intentionally NOT done here.
        // After login the frontend DeviceGate component calls POST /device/check
        // with the browser's stored Device ID. If the device is unregistered,
        // the cashier sees the Device ID screen so they can send it to the admin.
        // Blocking login here would prevent that screen from ever being reached.
        $user->load('branch');
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => "User logged in: {$user->name}",
            'module'     => 'Auth',
            'details'    => "Role: " . ($user->role ?? 'N/A'),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'user'    => array_merge($user->toArray(), [
                'branch_vat_type' => $user->branch?->vat_type ?? 'vat',
            ]),
            'token'      => $token,
            'pos_number' => null,  // set by DeviceGate via POST /device/check
            'branch_id'  => null,  // set by DeviceGate via POST /device/check
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
    public function googleLogin(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'name'  => 'required|string|max:255',
    ]);

    $user = User::firstOrCreate(
        ['email' => $request->email],
        [
            'name'     => $request->name,
            'password' => Hash::make(Str::random(32)),
            'role'     => 'customer',
        ]
    );

    AuditLog::create([
        'user_id'    => $user->id,
        'action'     => "User signed in via Google: {$user->name}",
        'module'     => 'Auth',
        'details'    => "Email: {$user->email}",
        'ip_address' => $request->ip(),
    ]);

    $token = $user->createToken('app')->plainTextToken; // ← add this

    return response()->json([
        'user'  => $user,
        'token' => $token,  // ← add this
    ], 200);
}
}