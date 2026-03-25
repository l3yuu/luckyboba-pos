<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosDevice extends Model
{
    protected $fillable = [
        'device_name',
        'pos_number',
        'branch_id',
        'user_id',      // ← ADD
        'status',
        'last_seen',
    ];

    protected function casts(): array
    {
        return [
            'last_seen'  => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()                          // ← ADD
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'INACTIVE');
    }
}