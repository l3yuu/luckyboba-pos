<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZReading extends Model
{
// app/Models/ZReading.php

    protected $fillable = [
        'reading_date',
        'branch_id',
        'total_sales',
        'net_sales',
        'data',
        'is_closed',
        'closed_at',
    ];

    protected $casts = [
        'data' => 'array' // This ensures 'data' is saved as JSON in DB but acts as an Array in PHP
    ];
}