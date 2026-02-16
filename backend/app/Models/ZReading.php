<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZReading extends Model
{
    protected $fillable = [
        'reading_date',
        'total_sales',
        'data'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'data' => 'array', // This turns the JSON column into a usable array automatically
        'reading_date' => 'date',
    ];
}