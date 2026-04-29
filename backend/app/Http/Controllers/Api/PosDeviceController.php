<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PosDevice;
use App\Models\User;
use Illuminate\Http\Request;

class PosDeviceController extends Controller
{
    public function check(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string',
            'user_id'     => 'nullable|exists:users,id',
        ]);

        $device = PosDevice::where('device_name', $request->device_name)
            ->with(['branch', 'users'])
            ->first();

        if (!$device) {
            return response()->json(['success' => false, 'registered' => false, 'message' => 'Device not registered. Contact your administrator.'], 403);
        }

        if ($device->status === 'INACTIVE') {
            return response()->json(['success' => false, 'registered' => false, 'message' => 'This device has been deactivated. Contact your administrator.'], 403);
        }

        if ($request->filled('user_id')) {
            $user = User::find($request->user_id);
            $posRoles = ['cashier', 'team_leader', 'supervisor'];
            if ($user && in_array($user->role, $posRoles)) {
                if ($device->branch_id && $user->branch_id && $device->branch_id !== $user->branch_id) {
                    return response()->json(['success' => false, 'registered' => false, 'message' => 'This device belongs to a different branch. Access denied.'], 403);
                }
                if ($device->users->isEmpty()) {
                    return response()->json([
                        'success' => false, 
                        'registered' => true, 
                        'assigned' => false,
                        'pos_number' => $device->pos_number,
                        'message' => 'This device has no cashier assigned. Contact your administrator.'
                    ], 403);
                }
                if (!$device->users->contains($user->id)) {
                    return response()->json([
                        'success' => false, 
                        'registered' => true, 
                        'assigned' => false,
                        'pos_number' => $device->pos_number,
                        'message' => 'You are not assigned to this device.'
                    ], 403);
                }
            }
        }

        $device->update(['last_seen' => now()]);

        return response()->json([
            'success'          => true,
            'registered'       => true,
            'pos_number'       => $device->pos_number,
            'branch_id'        => $device->branch_id,
            'branch'           => $device->branch,
            'assigned_user_id' => $device->users->pluck('id'),
        ]);
    }

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = PosDevice::with(['users:id,name,branch_id', 'branch:id,name'])
                ->orderBy('created_at', 'desc');

            // Branch managers only see their own branch's devices
            if ($user->role === 'branch_manager' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            } elseif ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }

            $devices = $query->get()->map(function ($d) {
                $d->assigned_users = $d->users;
                $d->user_id        = $d->users->first()?->id ?? null;
                $d->user           = $d->users->first();
                return $d;
            });

            return response()->json(['success' => true, 'data' => $devices]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function assignUser(Request $request, $id)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $device = PosDevice::findOrFail($id);
        $user   = User::findOrFail($request->user_id);

        $device->users()->syncWithoutDetaching([$user->id]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Assigned cashier {$user->name} to device {$device->pos_number}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name} | User ID: {$user->id}",
            'ip_address' => $request->ip(),
        ]);

        $device->load(['branch', 'users']);
        $device->assigned_users = $device->users;
        $device->user           = $device->users->first();
        $device->user_id        = $device->users->first()?->id ?? null;

        return response()->json([
            'success' => true,
            'message' => "{$user->name} assigned to {$device->pos_number}.",
            'device'  => $device,
        ]);
    }

    public function unassignUser(Request $request, $id)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $device = PosDevice::with('users')->findOrFail($id);
        $user   = User::findOrFail($request->user_id);

        $device->users()->detach($user->id);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Unassigned {$user->name} from device {$device->pos_number}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name}",
            'ip_address' => $request->ip(),
        ]);

        $device->load(['branch', 'users']);
        $device->assigned_users = $device->users;
        $device->user           = $device->users->first();
        $device->user_id        = $device->users->first()?->id ?? null;

        return response()->json([
            'success' => true,
            'message' => 'Cashier unassigned.',
            'device'  => $device,
        ]);
    }

    // ── SUPERADMIN — register device ─────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string|unique:pos_devices,device_name',
            'pos_number'  => 'required|string|unique:pos_devices,pos_number',
            'branch_id'   => 'required|exists:branches,id',
        ]);

        $user = $request->user();
        if ($user->role === 'branch_manager' && $user->branch_id) {
            $request->merge(['branch_id' => $user->branch_id]);
        }

        $device = PosDevice::create([
            'device_name' => $request->device_name,
            'pos_number'  => $request->pos_number,
            'branch_id'   => $request->branch_id,
            'status'      => 'ACTIVE',
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Registered POS device: {$device->pos_number}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name} | Branch ID: {$device->branch_id}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Device registered successfully.',
            'device'  => $device->load('branch'),
        ], 201);
    }



    // ── SUPERADMIN — toggle ACTIVE / INACTIVE ────────────────────────────────
    public function toggleStatus(Request $request, $id)
    {
        $device    = PosDevice::findOrFail($id);
        $newStatus = $device->status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        $device->update(['status' => $newStatus]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Toggled POS device: {$device->pos_number} → {$newStatus}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'device'  => $device,
        ]);
    }

    // ── SUPERADMIN — delete device ────────────────────────────────────────────
    public function destroy(Request $request, $id)
    {
        $device = PosDevice::findOrFail($id);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deleted POS device: {$device->pos_number}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name} | Branch ID: {$device->branch_id}",
            'ip_address' => $request->ip(),
        ]);

        $device->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device deleted successfully.',
        ]);
    }
}