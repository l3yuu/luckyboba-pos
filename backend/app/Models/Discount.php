<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    use HasFactory;

    // These must match your MariaDB columns exactly
    protected $fillable = [
        'name',
        'amount',
        'status',
        'type'
    ];
}