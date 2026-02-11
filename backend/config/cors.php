<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // It is safer to be explicit with paths for Sanctum
    'paths' => [
        'api/*', 
        'sanctum/csrf-cookie', 
        'login', 
        'logout',
        'register'
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Ensure no trailing slash here
        'https://luckyboba-pos.vercel.app', 
        'http://localhost:5173',
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];