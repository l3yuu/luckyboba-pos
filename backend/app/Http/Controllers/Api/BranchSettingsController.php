<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class BranchSettingsController extends Controller
{
    /**
     * Get branch payment settings
     * GET /api/branch/payment-settings
     */
    public function getPaymentSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not assigned to a branch.'
            ], 403);
        }

        $branch = Branch::findOrFail($user->branch_id);

        return response()->json([
            'success' => true,
            'data' => [
                'gcash_name'   => $branch->gcash_name,
                'gcash_number' => $branch->gcash_number,
                'gcash_qr'     => $branch->gcash_qr ? url('storage/' . $branch->gcash_qr) : null,
                'maya_name'    => $branch->maya_name,
                'maya_number'  => $branch->maya_number,
                'maya_qr'      => $branch->maya_qr ? url('storage/' . $branch->maya_qr) : null,
            ]
        ]);
    }

    /**
     * Update branch payment settings
     * POST /api/branch/payment-settings
     */
    public function updatePaymentSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not assigned to a branch.'
            ], 403);
        }

        $request->validate([
            'gcash_name'   => 'nullable|string|max:255',
            'gcash_number' => 'nullable|string|max:255',
            'gcash_qr'     => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'maya_name'    => 'nullable|string|max:255',
            'maya_number'  => 'nullable|string|max:255',
            'maya_qr'      => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $branch = Branch::findOrFail($user->branch_id);

        $data = $request->only(['gcash_name', 'gcash_number', 'maya_name', 'maya_number']);

        if ($request->hasFile('gcash_qr')) {
            // Delete old QR if exists
            if ($branch->gcash_qr) {
                Storage::disk('public')->delete($branch->gcash_qr);
            }
            $data['gcash_qr'] = $request->file('gcash_qr')->store('branches/qrs', 'public');
        }

        if ($request->hasFile('maya_qr')) {
            // Delete old QR if exists
            if ($branch->maya_qr) {
                Storage::disk('public')->delete($branch->maya_qr);
            }
            $data['maya_qr'] = $request->file('maya_qr')->store('branches/qrs', 'public');
        }

        $branch->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Payment settings updated successfully.',
            'data' => [
                'gcash_name'   => $branch->gcash_name,
                'gcash_number' => $branch->gcash_number,
                'gcash_qr'     => $branch->gcash_qr ? url('storage/' . $branch->gcash_qr) : null,
                'maya_name'    => $branch->maya_name,
                'maya_number'  => $branch->maya_number,
                'maya_qr'      => $branch->maya_qr ? url('storage/' . $branch->maya_qr) : null,
            ]
        ]);
    }
}
