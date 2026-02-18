<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        // Returns: { "tax_rate": "12", "service_charge": "5" }
        return response()->json(Setting::pluck('value', 'key'));
    }

    public function update(Request $request)
    {
        // $request->all() will be an object of settings from React
        foreach ($request->all() as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'Settings saved successfully']);
    }
}