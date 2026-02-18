<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubCategoryController extends Controller
{
    /**
     * Display a listing of sub-categories with item counts.
     */
    public function index()
    {
        try {
            // withCount('menuItems') adds a menu_items_count attribute to the result
            $subCategories = SubCategory::with('category')
                ->withCount('menuItems')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($sub) {
                    return [
                        'id' => $sub->id,
                        'name' => $sub->name,
                        'mainCategory' => $sub->category->name ?? 'N/A',
                        'itemCount' => $sub->menu_items_count,
                    ];
                });

            return response()->json($subCategories);
        } catch (\Exception $e) {
            Log::error("SubCategory Index Error: " . $e->getMessage());
            return response()->json(['message' => 'Error fetching data'], 500);
        }
    }

    /**
     * Store a newly created sub-category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        try {
            $sub = SubCategory::create($validated);
            
            // Return the new object formatted for your React state
            return response()->json([
                'id' => $sub->id,
                'name' => $sub->name,
                'mainCategory' => $sub->category->name,
                'itemCount' => 0
            ], 201);
        } catch (\Exception $e) {
            Log::error("SubCategory Store Error: " . $e->getMessage());
            return response()->json(['message' => 'Error saving sub category'], 500);
        }
    }
}