<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Franchise;
use Illuminate\Http\Request;

class FranchiseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Franchise::withCount('branches')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255|unique:franchises,name',
            'contact_email'  => 'nullable|email',
            'contact_number' => 'nullable|string',
            'branding_colors' => 'nullable|array',
        ]);

        $franchise = Franchise::create($request->all());

        return response()->json($franchise, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $franchise = Franchise::with('branches')->findOrFail($id);
        return response()->json($franchise);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $franchise = Franchise::findOrFail($id);

        $request->validate([
            'name'           => 'required|string|max:255|unique:franchises,name,' . $id,
            'contact_email'  => 'nullable|email',
            'contact_number' => 'nullable|string',
            'branding_colors' => 'nullable|array',
        ]);

        $franchise->update($request->all());

        return response()->json($franchise);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $franchise = Franchise::findOrFail($id);
        
        // Unlink branches
        $franchise->branches()->update(['franchise_id' => null]);
        
        $franchise->delete();

        return response()->json(['message' => 'Franchise deleted successfully']);
    }

    /**
     * Assign branches to a franchise
     */
    public function assignBranches(Request $request, $id)
    {
        $request->validate([
            'branch_ids' => 'required|array',
            'branch_ids.*' => 'exists:branches,id'
        ]);

        $franchise = Franchise::findOrFail($id);
        \App\Models\Branch::whereIn('id', $request->branch_ids)->update(['franchise_id' => $franchise->id]);

        return response()->json(['message' => 'Branches assigned successfully']);
    }
}
