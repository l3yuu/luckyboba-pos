<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PosDevice;
use App\Models\User;
use Illuminate\Http\Request;

class PosDeviceController extends Controller
{
    // ── PUBLIC ────────────────────────────────────────────────────────────────
public function check(Request $request)
{
    $request->validate([
        'device_name' => 'required|string',
        'user_id'     => 'nullable|exists:users,id',
    ]);

    $device = PosDevice::where('device_name', $request->device_name)
        ->with(['branch', 'user'])
        ->first();

    // Case 1: Device not in DB at all — branch has no registered devices
    if (! $device) {
        return response()->json([
            'success'    => false,
            'registered' => false,
            'message'    => 'Device not registered. Contact your administrator.',
        ], 403);
    }

    // Case 2: Device is deactivated
    if ($device->status === 'INACTIVE') {
        return response()->json([
            'success'    => false,
            'registered' => false,
            'message'    => 'This device has been deactivated. Contact your administrator.',
        ], 403);
    }

    if ($request->filled('user_id')) {
        $user = User::find($request->user_id);

        if ($user && $user->role === 'cashier') {
            // Case 3: Device belongs to a different branch
            if ($device->branch_id !== null && $user->branch_id !== null
                && $device->branch_id !== $user->branch_id) {
                return response()->json([
                    'success'    => false,
                    'registered' => false,
                    'message'    => 'This device belongs to a different branch. Access denied.',
                ], 403);
            }

            // Case 4: Cashier has a different device assigned to them
            $assignedDevice = PosDevice::where('user_id', $user->id)->first();
            if ($assignedDevice && $assignedDevice->device_name !== $request->device_name) {
                return response()->json([
                    'success'    => false,
                    'registered' => false,
                    'message'    => 'This is not your assigned device. Please use your designated terminal.',
                ], 403);
            }

            // Case 5: Device exists in branch but no cashier assigned to it yet
            if (! $device->user_id) {
                return response()->json([
                    'success'    => false,
                    'registered' => false,
                    'message'    => 'This device has no cashier assigned. Contact your administrator.',
                ], 403);
            }

            // Case 6: Device is assigned to a different cashier
            if ($device->user_id !== $user->id) {
                return response()->json([
                    'success'    => false,
                    'registered' => false,
                    'message'    => 'This device is assigned to another cashier.',
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
        'assigned_user_id' => $device->user_id,
    ]);
}
    // ── SUPERADMIN — list all devices ─────────────────────────────────────────
    public function index(Request $request)
    {
        try {
            $query = PosDevice::with(['user:id,name,branch_id', 'branch:id,name'])
                ->orderBy('created_at', 'desc');

            // Filter by branch_id if provided (for cashier/branch-level views)
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }

            $devices = $query->get();

            return response()->json([
                'success' => true,
                'data'    => $devices,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── SUPERADMIN — register device ─────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string|unique:pos_devices,device_name',
            'pos_number'  => 'required|string|unique:pos_devices,pos_number',
            'branch_id'   => 'required|exists:branches,id',
        ]);

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

    // ── SUPERADMIN — assign cashier to device ─────────────────────────────────
    public function assignUser(Request $request, $id)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $device = PosDevice::findOrFail($id);
        $user   = User::findOrFail($request->user_id);

        // 1 cashier : 1 device — unassign them from any previous device first
        PosDevice::where('user_id', $user->id)
                 ->where('id', '!=', $device->id)
                 ->update(['user_id' => null]);

        $device->update(['user_id' => $user->id]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Assigned cashier {$user->name} to device {$device->pos_number}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name} | User ID: {$user->id}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$user->name} assigned to {$device->pos_number}.",
            'device'  => $device->load(['branch', 'user']),
        ]);
    }

    // ── SUPERADMIN — unassign cashier from device ─────────────────────────────
    public function unassignUser(Request $request, $id)
    {
        $device = PosDevice::with('user')->findOrFail($id);
        $name   = $device->user?->name ?? 'No user';

        $device->update(['user_id' => null]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Unassigned cashier from device {$device->pos_number}",
            'module'     => 'POS Device',
            'details'    => "Device: {$device->device_name} | Previous user: {$name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cashier unassigned from device.',
            'device'  => $device->load('branch'),
        ]);
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