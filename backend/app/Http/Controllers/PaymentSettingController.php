<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaymentSettingController extends Controller
{
    public function index()
    {
        // For now, we are hardcoding these values so your Flutter app works instantly.
        // In the future, you could pull these from a 'settings' table in your DB!
        return response()->json([
            'success'      => true,
            'account_name' => 'Lucky Boba Store',
            'gcash_number' => '09944966180', // ⬅️ Change this to your real GCash number
            'maya_number'  => '09476157499', // ⬅️ Change this to your real Maya number
            
            // If you have QR code images uploaded, you can put the full URLs here.
            // Leaving them as null tells Flutter to use the default asset images.
            'gcash_qr_url' => null, 
            'maya_qr_url'  => null,
        ]);
    }
}