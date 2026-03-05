<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cup;

class CupController extends Controller
{
    public function index()
    {
        return response()->json(Cup::all());
    }
}