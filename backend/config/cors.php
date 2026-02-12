<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        
        'https://luckyboba-pos-frontend.up.railway.app', 
        
        // 2. Keep these for local development
        'http://localhost:5173',
        'http://localhost:3000',
        
        // 3. Optional: You can keep Vercel for now as a backup
        'https://luckyboba-pos.vercel.app', 
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // This MUST stay true for cookies/sessions to work
    'supports_credentials' => true,

];