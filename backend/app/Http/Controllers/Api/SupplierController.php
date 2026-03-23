<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::with('materials:id,name,unit')
            ->withCount('materials')
            ->orderBy('name')
            ->get();
        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $supplier = Supplier::create($request->only([
            'name','contact_person','phone','email','address','payment_terms','is_active',
        ]));
        if ($request->has('material_ids')) {
            $supplier->materials()->sync($request->material_ids);
        }
        return response()->json($supplier->load('materials:id,name,unit'), 201);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->update($request->only([
            'name','contact_person','phone','email','address','payment_terms','is_active',
        ]));
        if ($request->has('material_ids')) {
            $supplier->materials()->sync($request->material_ids);
        }
        return response()->json($supplier->load('materials:id,name,unit'));
    }

    public function destroy($id)
    {
        Supplier::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted successfully.']);
    }
}