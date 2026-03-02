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
        'http://localhost:5173',
        'http://localhost:3000',
        'https://luckyboba-pos.vercel.app', 
        'https://luckybobastores.com',
        'https://www.luckybobastores.com',  // 👈 add www version
        'https://luckyboba-qg9jh57q3-leumars-projects.vercel.app', // 👈 your current vercel URL
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // This MUST stay true for cookies/sessions to work
    'supports_credentials' => true,

];