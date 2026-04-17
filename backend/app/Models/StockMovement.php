<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $raw_material_id
 * @property int|null $branch_id
 * @property int|null $user_id
 * @property float|null $before_stock
 * @property float|null $after_stock
 * @property string $type
 * @property float $quantity
 * @property string $reason
 * @property \Illuminate\Support\Carbon|null $created_at
 */
class StockMovement extends Model
{
    protected $fillable = [
        'raw_material_id',
        'branch_id',
        'user_id',
        'before_stock',
        'after_stock',
        'type',
        'quantity',
        'reason',
    ];

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}