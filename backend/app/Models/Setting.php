<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    // Allow these columns to be filled by the seeder/controller
    protected $fillable = ['key', 'value'];
}