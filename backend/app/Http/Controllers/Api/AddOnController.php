<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AddOn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request; 
use App\Traits\MenuCache;

class AddOnController extends Controller
{
    use MenuCache;

    public function index(Request $request): JsonResponse
    {
        $addOns = AddOn::when(!$request->boolean('all'), fn($q) => $q->where('is_available', true))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderBy('name')
            ->get();

        // Apply branch-level filtering if user is authenticated
        $branchId = $request->query('branch_id') ?? auth()->user()?->branch_id;

        if ($branchId) {
            try {
                $disabled = \DB::table('branch_availability')
                    ->where('branch_id', $branchId)
                    ->where('entity_type', 'add_on')
                    ->where('is_available', false)
                    ->pluck('entity_id');

                if ($disabled->isNotEmpty()) {
                    $addOns = $addOns->filter(fn($a) => !$disabled->contains($a->id))->values();
                }
            } catch (\Exception $e) {
                // Table doesn't exist yet, skip filtering
            }
        }

        return response()->json($addOns);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'grab_price'   => 'nullable|numeric|min:0',
            'panda_price'  => 'nullable|numeric|min:0',
            'barcode'      => 'nullable|string|max:100', 
            'category'     => 'required|string|max:100',
            'is_available' => 'boolean',
        ]);
        $addOn = AddOn::create($data);
        $this->clearMenuCache();
        return response()->json($addOn, 201);
    }

    public function update(Request $request, AddOn $addOn): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'price'        => 'sometimes|numeric|min:0',
            'grab_price'   => 'nullable|numeric|min:0',
            'panda_price'  => 'nullable|numeric|min:0',
            'category'     => 'sometimes|string|max:100',
            'is_available' => 'boolean',
        ]);
        $addOn->update($data);
        $this->clearMenuCache();
        return response()->json($addOn);
    }

    public function destroy(AddOn $addOn): JsonResponse
    {
        $addOn->delete();
        $this->clearMenuCache();
        return response()->json(['success' => true]);
    }
}