<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Franchise extends Model
{
    protected $fillable = [
        'name', 'contact_email', 'contact_number', 'branding_logo', 'branding_colors', 'status'
    ];

    protected $casts = [
        'branding_colors' => 'array',
    ];

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }
}
