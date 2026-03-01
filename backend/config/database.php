<?php

use Illuminate\Support\Str;

return [

    // Switch default to 'mysql' for instant local speed
    'default' => env('DB_CONNECTION', 'mysql'), 

    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
            'timezone' => '+08:00',
        ],

        /*
        |--------------------------------------------------------------------------
        | Primary Connection: Local MariaDB (HeidiSQL)
        |--------------------------------------------------------------------------
        */
        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'lucky_boba_local'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', '1234'),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
        ],

        /*
        |--------------------------------------------------------------------------
        | Backup Connection: Supabase (PostgreSQL)
        |--------------------------------------------------------------------------
        */
        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_BACKUP_HOST', '127.0.0.1'),
            'port' => env('DB_BACKUP_PORT', '5432'),
            'database' => env('DB_BACKUP_DATABASE', 'postgres'),
            'username' => env('DB_BACKUP_USERNAME', 'postgres'),
            'password' => env('DB_BACKUP_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => env('DB_SSLMODE', 'prefer'),
        ],

    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-database-'),
        ],
        'default' => [
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],
    ],

];