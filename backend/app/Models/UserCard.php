<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'card_number',
        'status',
    ];

    /**
     * Get the user that owns this card.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}