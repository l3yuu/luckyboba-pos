<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AddOn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request; 

class AddOnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addOns = AddOn::when(!$request->boolean('all'), fn($q) => $q->where('is_available', true))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderBy('name')
            ->get();

        return response()->json($addOns);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'grab_price'   => 'nullable|numeric|min:0',
            'panda_price'  => 'nullable|numeric|min:0',
            'category'     => 'required|string|max:100',
            'is_available' => 'boolean',
        ]);
        $addOn = AddOn::create($data);
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
        return response()->json($addOn);
    }

    public function destroy(AddOn $addOn): JsonResponse
    {
        $addOn->delete();
        return response()->json(['success' => true]);
    }
}