<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class MenuListController extends Controller
{
    public function index()
    {
        $items = DB::table('menu_items')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->select(
                'menu_items.id',
                'menu_items.name',
                'menu_items.barcode',
                'categories.name as category',
                'menu_items.price as sellingPrice',
                // Adding placeholders for cost if they aren't in your DB yet
                DB::raw('0.00 as unitCost'), 
                DB::raw('0.00 as totalCost')
            )
            ->get();

        return response()->json($items);
    }
}