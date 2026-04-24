<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeaturedDrink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FeaturedDrinkController extends Controller
{
    /**
     * List all featured drinks (admin).
     */
    public function index()
    {
        $items = FeaturedDrink::orderBy('sort_order')->orderByDesc('created_at')->get();

        $items->transform(function ($item) {
            $item->image_url = $item->image ? url('storage/' . $item->image) : null;
            return $item;
        });

        return response()->json($items);
    }

    /**
     * Public endpoint — only active items, for the mobile app.
     */
    public function publicIndex()
    {
        $items = FeaturedDrink::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'title', 'subtitle', 'image', 'cta_text']);

        $items->transform(function ($item) {
            $item->image_url = $item->image ? url('storage/' . $item->image) : null;
            return $item;
        });

        return response()->json($items);
    }

    /**
     * Store a new featured drink.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'      => 'required|string|max:255',
            'subtitle'   => 'nullable|string|max:255',
            'image'      => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'cta_text'   => 'nullable|string|max:100',
            'is_active'  => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $data = $request->only(['title', 'subtitle', 'cta_text', 'is_active', 'sort_order']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('featured', 'public');
        }

        $data['cta_text']   = $data['cta_text']   ?? 'ORDER NOW';
        $data['is_active']  = $data['is_active']  ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $item = FeaturedDrink::create($data);
        $item->image_url = $item->image ? url('storage/' . $item->image) : null;

        return response()->json($item, 201);
    }

    /**
     * Update an existing featured drink.
     */
    public function update(Request $request, $id)
    {
        $item = FeaturedDrink::findOrFail($id);

        $request->validate([
            'title'      => 'sometimes|required|string|max:255',
            'subtitle'   => 'nullable|string|max:255',
            'image'      => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'cta_text'   => 'nullable|string|max:100',
            'is_active'  => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $data = $request->only(['title', 'subtitle', 'cta_text', 'is_active', 'sort_order']);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $data['image'] = $request->file('image')->store('featured', 'public');
        }

        $item->update($data);
        $item->image_url = $item->image ? url('storage/' . $item->image) : null;

        return response()->json($item);
    }

    /**
     * Delete a featured drink.
     */
    public function destroy($id)
    {
        $item = FeaturedDrink::findOrFail($id);

        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return response()->json(['message' => 'Featured drink deleted.']);
    }

    /**
     * Toggle active status.
     */
    public function toggle($id)
    {
        $item = FeaturedDrink::findOrFail($id);
        $item->is_active = !$item->is_active;
        $item->save();

        return response()->json($item);
    }
}
