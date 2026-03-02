<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemSerial extends Model
{
    protected $fillable = ['item_name', 'serial_number', 'status', 'date_added'];
}