<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    // Match these to your columns in image_1ff19f.png
    protected $fillable = [
        'user_id', 
        'action', 
        'module', 
        'details', 
        'ip_address'
    ];

    /**
     * Get the user that performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}