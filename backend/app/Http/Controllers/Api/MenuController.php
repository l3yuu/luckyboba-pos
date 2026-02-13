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
    // Match the new relationship name
    $menu = Category::with('menu_items')->get(); 
    return response()->json($menu);
}
}