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
        'ownership_type',
        'vat_type',
    ];

    protected $casts = [
        'total_sales'    => 'decimal:2',
        'today_sales'    => 'decimal:2',
        'ownership_type' => 'string',
        'vat_type'       => 'string',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function manager()
    {
        return $this->hasOne(User::class)->where('role', 'branch_manager');
    }

    public function managers()
    {
        return $this->users()->where('role', 'branch_manager');
    }

    public function activeUsers()
    {
        return $this->users()->where('status', 'ACTIVE');
    }

    public function cashiers()
    {
        return $this->users()->where('role', 'cashier');
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}