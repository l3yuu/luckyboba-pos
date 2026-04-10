<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'branch_id',
        'recorded_by',
        'ref_num',
        'title',
        'notes',
        'date',
        'category',
        'amount'
    ];

    protected $casts = [
        'amount' => 'float',
        'date' => 'date:Y-m-d'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}