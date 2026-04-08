<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'title',
        'ref_num',
        'description',
        'date',
        'category',
        'amount',
        'branch_id',
        'notes',
        'receipt_path',
        'recorded_by'
    ];

    protected $casts = [
        'amount' => 'float',
        'date' => 'date:Y-m-d',
        'branch_id' => 'integer'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}