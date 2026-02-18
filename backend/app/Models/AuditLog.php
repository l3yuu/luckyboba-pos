<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'action',
        'module',
        'details',
        'ip_address'
    ];

    /**
     * Get the user that performed the action.
     * * This allows you to do AuditLog::with('user') in your controller.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}