<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'status',
        'total_sales',
        'today_sales',
    ];

    protected $casts = [
        'total_sales' => 'decimal:2',
        'today_sales' => 'decimal:2',
    ];

    /**
     * Get all users assigned to this branch.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the branch manager (single user with branch_manager role).
     */
    public function manager()
    {
        return $this->hasOne(User::class)->where('role', 'branch_manager');
    }

    /**
     * Get all branch managers (in case multiple are assigned).
     */
    public function managers()
    {
        return $this->users()->where('role', 'branch_manager');
    }

    /**
     * Get active users only.
     */
    public function activeUsers()
    {
        return $this->users()->where('status', 'ACTIVE');
    }

    /**
     * Get cashiers of this branch.
     */
    public function cashiers()
    {
        return $this->users()->where('role', 'cashier');
    }

    /**
     * Get all sales for this branch.
     */
    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}