<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['ref_num', 'description', 'date', 'category', 'amount'];

    protected $casts = [
        'amount' => 'float',
        'date' => 'date:Y-m-d'
    ];
}