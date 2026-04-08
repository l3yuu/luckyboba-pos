<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'raw_material_id',
        'type',
        'quantity',
        'reason',
        'branch_id',
    ];

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}