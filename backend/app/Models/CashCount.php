<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashCount extends Model
{
    protected $fillable = [
        'terminal_id', 
        'total_amount', 
        'breakdown', 
        'remarks', 
        'user_id'
    ];

    protected $casts = [
        'breakdown' => 'array', // This converts the JSON from DB to a React-friendly object
    ];
}
