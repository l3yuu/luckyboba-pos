<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $transfer_number
 * @property int $from_branch_id
 * @property int $to_branch_id
 * @property string $transfer_date
 * @property string $status
 * @property string|null $notes
 */
class StockTransfer extends Model
{
    protected $fillable = [
        'transfer_number',
        'from_branch_id',
        'to_branch_id',
        'transfer_date',
        'status',
        'notes',
    ];

    public function fromBranch()
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch()
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function items()
    {
        return $this->hasMany(StockTransferItem::class);
    }
}