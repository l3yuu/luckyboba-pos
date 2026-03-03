<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AddOn;
use Illuminate\Http\JsonResponse;

class AddOnController extends Controller
{
    public function index(): JsonResponse
    {
        $addOns = AddOn::where('is_available', true)
            ->orderBy('name')
            ->get();

        return response()->json($addOns);
    }
}