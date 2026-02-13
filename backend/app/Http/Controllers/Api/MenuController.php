<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;

class MenuController extends Controller
{
    /**
     * Fetch all categories and their associated menu items.
     */
    public function index()
    {
        // We use "with('menuItems')" to avoid the N+1 query problem
        $menu = Category::with('menuItems')->get();

        return response()->json($menu);
    }
}