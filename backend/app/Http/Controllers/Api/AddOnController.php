<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AddOn;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Request;

class AddOnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addOns = AddOn::where('is_available', true)
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderBy('name')
            ->get();

        return response()->json($addOns);
    }
}