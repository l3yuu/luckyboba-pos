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

        // ── 2FA Intercept for Superadmin ──────────────────────────────────────
        if ($user->role === 'superadmin') {
            $is2FAActive = \App\Models\Setting::where('key', 'two_factor')->value('value') === 'true';
            
            if ($is2FAActive) {
                $this->sendTwoFactorCode($user);

                return response()->json([
                    'success'      => true,
                    'requires_2fa' => true,
                    'message'      => 'A 2FA code has been sent to your email.'
                ]);
            }
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

    public function verify2FA(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
            'code'     => 'required|string|size:6'
        ]);

        $user = User::where('email', $request->email)->first();

        // Re-verify credentials so the endpoint can't be brute-forced without password
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        if ($user->two_factor_code !== $request->code || 
            !$user->two_factor_expires_at || 
            now()->greaterThan($user->two_factor_expires_at)) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired 2FA code.'], 400);
        }

        // Clear OTP data upon success
        $user->two_factor_code = null;
        $user->two_factor_expires_at = null;
        $user->save();

        $user->load('branch');
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => "User logged in via 2FA: {$user->name}",
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
            'pos_number' => null,
            'branch_id'  => null,
        ]);
    }

    public function resend2FA(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        if ($user->role !== 'superadmin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $this->sendTwoFactorCode($user);

        return response()->json([
            'success' => true,
            'message' => 'A new 2FA code has been sent to your email.'
        ]);
    }

    private function sendTwoFactorCode(User $user)
    {
        $otp = rand(100000, 999999);
        $user->two_factor_code = $otp;
        $user->two_factor_expires_at = now()->addMinutes(10);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\TwoFactorCodeMail($otp));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send 2FA email: " . $e->getMessage());
            \Illuminate\Support\Facades\Log::warning("2FA CODE FOR {$user->email}: {$otp}");
        }
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

    public function register(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'password'      => 'required|string|min:8',
            'referral_code' => 'nullable|string|exists:users,referral_code',
        ]);

        $referredBy = null;
        if ($request->referral_code) {
            $referrer = User::where('referral_code', $request->referral_code)->first();
            $referredBy = $referrer ? $referrer->id : null;
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'role'          => 'customer',
            'status'        => 'active',
            'referred_by_id' => $referredBy,
            'referral_code' => strtoupper(Str::random(8)),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 201);
    }
}