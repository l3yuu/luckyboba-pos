<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosDevice extends Model
{
    protected $fillable = [
        'device_name',
        'pos_number',
        'branch_id',
        'status',
        'last_seen',
        // user_id removed — now handled via pivot table
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

    // Legacy single-user relationship (kept for backwards compat)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // New many-to-many relationship
    public function users()
    {
        return $this->belongsToMany(User::class, 'pos_device_users')->withTimestamps();
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