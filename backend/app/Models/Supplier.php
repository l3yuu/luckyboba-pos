<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name', 'contact_person', 'phone', 'email',
        'address', 'payment_terms', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function materials()
    {
        return $this->belongsToMany(RawMaterial::class, 'supplier_materials', 'supplier_id', 'raw_material_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}