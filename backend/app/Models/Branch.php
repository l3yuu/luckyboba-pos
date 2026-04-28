<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
    'name',
    'location',
    'status',
    'total_sales',
    'today_sales',
    'ownership_type',
    'vat_type',
    'brand',
    'company_name',
    'store_address',
    'vat_reg_tin',
    'min_number',
    'serial_number',
    'owner_name',
    'gcash_name',
    'gcash_number',
    'gcash_qr',
    'maya_name',
    'maya_number',
    'maya_qr',
    'franchise_id',
    'latitude',
    'longitude',
    'image',
    'kiosk_pin',
    'kiosk_password',
];

protected $casts = [
    'total_sales'    => 'decimal:2',
    'today_sales'    => 'decimal:2',
    'ownership_type' => 'string',
    'vat_type'       => 'string',
    'brand'          => 'string',
    'company_name'   => 'string',
    'store_address'  => 'string',
    'vat_reg_tin'    => 'string',
    'min_number'     => 'string',
    'serial_number'  => 'string',
    'latitude'       => 'decimal:8',
    'longitude'      => 'decimal:8',
];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function franchise()
    {
        return $this->belongsTo(Franchise::class);
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