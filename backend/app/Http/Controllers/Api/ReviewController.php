<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Traits\LoyaltyCheck;

class ReviewController extends Controller
{
    use LoyaltyCheck;

    public function index(Request $request)
    {
        if (!$this->hasActiveCard($request)) {
            return $this->loyaltyRequiredResponse();
        }

        $reviews = Review::with(['user:id,name', 'branch:id,name'])
            ->where('is_visible', true)
            ->latest()
            ->paginate(20);
            
        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        if (!$this->hasActiveCard($request)) {
            return $this->loyaltyRequiredResponse();
        }

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'sale_id'   => 'nullable|exists:sales,id',
            'rating'    => 'required|integer|min:1|max:5',
            'comment'   => 'nullable|string',
        ]);

        $review = Review::create([
            'user_id'   => $request->user()->id,
            'branch_id' => $request->branch_id,
            'sale_id'   => $request->sale_id,
            'rating'    => $request->rating,
            'comment'   => $request->comment,
        ]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'review'  => $review
        ], 201);
    }

    public function branchReviews($branchId)
    {
        $reviews = Review::with('user:id,name')
            ->where('branch_id', $branchId)
            ->where('is_visible', true)
            ->latest()
            ->paginate(15);
            
        return response()->json($reviews);
    }
}
